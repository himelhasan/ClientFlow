import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { findOrCreateCustomer } from "@/lib/engine/customer";
import { checkLeadQuota } from "@/lib/engine/quota";
import { normalizeBdPhone, isValidBdPhone, formatBDT, formatBdDate } from "@/lib/utils/bangladesh";
import { whatsAppService, smsService } from "@/lib/messaging/adapters";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params;
    const body = await req.json();

    const {
      serviceId,
      branchId, // Selected branch location
      date, // "YYYY-MM-DD"
      startTime, // "14:00"
      endTime, // "14:30"
      customerName,
      customerPhone,
      customerWhatsapp,
      customerEmail,
      partySize = 1,
      notes,
      utmSource = "website",
      utmMedium,
      utmCampaign,
    } = body;

    // 1. Fetch form and tenant
    const form = await prisma.form.findFirst({
      where: {
        OR: [{ id: formId }, { slug: formId }],
        status: "PUBLISHED",
      },
      include: {
        tenant: true,
      },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found or inactive" }, { status: 404 });
    }

    const tenantId = form.tenantId;

    // 2. Validate phone number
    if (!customerPhone || !isValidBdPhone(customerPhone)) {
      return NextResponse.json(
        { error: "Please provide a valid 11-digit Bangladeshi mobile number (e.g. 017XXXXXXXX)" },
        { status: 400 }
      );
    }

    if (!customerName || !serviceId || !date || !startTime) {
      return NextResponse.json(
        { error: "Name, service, date, and appointment slot are required" },
        { status: 400 }
      );
    }

    // 3. Verify lead quota
    const quotaCheck = await checkLeadQuota(tenantId);
    if (!quotaCheck.allowed) {
      console.warn(`Lead quota reached for tenant ${tenantId}: ${quotaCheck.reason}`);
    }

    // 4. Fetch service details
    const service = await prisma.service.findFirst({
      where: { id: serviceId, tenantId },
    });

    if (!service) {
      return NextResponse.json({ error: "Selected service was not found" }, { status: 400 });
    }

    // Determine target branch
    const effectiveBranchId = branchId || service.branchId || null;
    let branchName = "";
    if (effectiveBranchId) {
      const b = await prisma.branch.findUnique({ where: { id: effectiveBranchId } });
      if (b) branchName = b.name;
    }

    // 5. Deduplicate and find or create customer
    const customer = await findOrCreateCustomer({
      tenantId,
      name: customerName,
      phone: customerPhone,
      whatsapp: customerWhatsapp || customerPhone,
      email: customerEmail,
    });

    // 6. Create booking number
    const bookingCount = await prisma.booking.count({ where: { tenantId } });
    const bookingNumber = `#${1000 + bookingCount + 1}`;
    const appointmentDate = new Date(`${date}T00:00:00`);

    // 7. Execute Booking, Lead, and Submission creation in transaction
    const { booking, lead } = await prisma.$transaction(async (tx) => {
      // Create Lead record
      const leadRecord = await tx.lead.create({
        data: {
          tenantId,
          customerId: customer.id,
          formId: form.id,
          source: (utmSource.toUpperCase() as any) || "WEBSITE",
          status: "BOOKED",
          title: `Booking request for ${service.name}${branchName ? ` at ${branchName}` : ""}`,
          notes: notes || undefined,
          value: service.price,
        },
      });

      // Create Booking record routed directly to the selected branch
      const bookingRecord = await tx.booking.create({
        data: {
          tenantId,
          bookingNumber,
          customerId: customer.id,
          serviceId: service.id,
          branchId: effectiveBranchId,
          formId: form.id,
          leadId: leadRecord.id,
          status: "CONFIRMED",
          date: appointmentDate,
          startTime,
          endTime: endTime || startTime,
          durationMinutes: service.durationMinutes,
          partySize: Number(partySize) || 1,
          price: service.price,
          notes,
        },
      });

      // Log Lead and Booking events
      await tx.leadEvent.create({
        data: {
          tenantId,
          leadId: leadRecord.id,
          type: "BOOKING_CREATED",
          description: `Booked ${service.name} for ${date} at ${startTime}${branchName ? ` (${branchName})` : ""}`,
        },
      });

      await tx.bookingEvent.create({
        data: {
          tenantId,
          bookingId: bookingRecord.id,
          type: "CONFIRMED",
          description: `Appointment routed to ${branchName || "Main"} calendar via website booking form`,
        },
      });

      // Create Form Submission audit record
      await tx.formSubmission.create({
        data: {
          tenantId,
          formId: form.id,
          customerId: customer.id,
          leadId: leadRecord.id,
          data: { ...body, effectiveBranchId, branchName },
          utmSource,
          utmMedium,
          utmCampaign,
        },
      });

      // Increment form submission count and tenant lead count
      await tx.form.update({
        where: { id: form.id },
        data: { submitCount: { increment: 1 } },
      });

      await tx.business.update({
        where: { id: tenantId },
        data: { leadsUsed: { increment: 1 } },
      });

      // Create dashboard notification with branch detail
      await tx.notification.create({
        data: {
          tenantId,
          type: "NEW_BOOKING",
          title: `New Booking: ${customer.name}${branchName ? ` (${branchName})` : ""}`,
          message: `${customer.name} booked ${service.name} on ${date} at ${startTime}${branchName ? ` for ${branchName}` : ""}.`,
          link: `/dashboard/bookings?branchId=${effectiveBranchId || ""}`,
        },
      });

      return { booking: bookingRecord, lead: leadRecord };
    });

    // 8. Automated WhatsApp / SMS confirmation message
    const locationLine = branchName ? `\nLocation: ${branchName}` : "";
    const confirmationText = `Hi ${customer.name},\n\nYour appointment with ${form.tenant.name} is confirmed!\n\nService: ${service.name}${locationLine}\nDate: ${formatBdDate(appointmentDate)}\nTime: ${startTime}\nBooking ID: ${bookingNumber}\n\nReply to this message if you need to reschedule or have questions.`;

    const recipientPhone = customer.whatsapp || customer.phone;
    whatsAppService.send({
      tenantId,
      leadId: lead.id,
      bookingId: booking.id,
      to: recipientPhone,
      content: confirmationText,
    }).catch(() => {
      smsService.send({
        tenantId,
        leadId: lead.id,
        bookingId: booking.id,
        to: customer.phone,
        content: `Booking Confirmed: ${service.name} at ${branchName || form.tenant.name} on ${date} at ${startTime}. ID: ${bookingNumber}`,
      });
    });

    return NextResponse.json({
      success: true,
      bookingNumber,
      serviceName: service.name,
      branchName: branchName || undefined,
      date,
      startTime,
      price: formatBDT(service.price),
      message: "Appointment confirmed successfully!",
    });
  } catch (error: any) {
    console.error("Widget submission error:", error);
    return NextResponse.json({ error: error.message || "Failed to submit booking" }, { status: 500 });
  }
}
