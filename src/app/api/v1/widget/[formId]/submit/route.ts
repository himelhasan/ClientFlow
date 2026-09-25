import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { findOrCreateCustomer } from "@/lib/engine/customer";
import { checkLeadQuota } from "@/lib/engine/quota";
import { normalizeBdPhone, isValidBdPhone, formatBDT, formatBdDate } from "@/lib/utils/bangladesh";
import { whatsAppService, smsService } from "@/lib/messaging/adapters";

export async function POST(req: Request, { params }: { params: { formId: string } }) {
  try {
    const { formId } = params;
    const body = await req.json();

    const {
      serviceId,
      date, // "YYYY-MM-DD"
      startTime, // "14:00"
      endTime, // "14:30"
      customerName,
      customerPhone,
      customerWhatsapp,
      customerEmail,
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

    // 3. Verify lead quota (Section 68)
    const quotaCheck = await checkLeadQuota(tenantId);
    if (!quotaCheck.allowed) {
      console.warn(`Lead quota reached for tenant ${tenantId}: ${quotaCheck.reason}`);
      // Still accept customer booking but log alert for tenant
    }

    // 4. Fetch service details
    const service = await prisma.service.findFirst({
      where: { id: serviceId, tenantId },
    });

    if (!service) {
      return NextResponse.json({ error: "Selected service was not found" }, { status: 400 });
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
          title: `Booking request for ${service.name}`,
          notes: notes || undefined,
          value: service.price,
        },
      });

      // Create Booking record
      const bookingRecord = await tx.booking.create({
        data: {
          tenantId,
          bookingNumber,
          customerId: customer.id,
          serviceId: service.id,
          formId: form.id,
          leadId: leadRecord.id,
          status: "CONFIRMED",
          date: appointmentDate,
          startTime,
          endTime: endTime || startTime,
          durationMinutes: service.durationMinutes,
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
          description: `Booked ${service.name} for ${date} at ${startTime}`,
        },
      });

      await tx.bookingEvent.create({
        data: {
          tenantId,
          bookingId: bookingRecord.id,
          type: "CONFIRMED",
          description: "Appointment automatically confirmed via website widget",
        },
      });

      // Create Form Submission audit record
      await tx.formSubmission.create({
        data: {
          tenantId,
          formId: form.id,
          customerId: customer.id,
          leadId: leadRecord.id,
          data: body,
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

      // Create dashboard notification for business owner
      await tx.notification.create({
        data: {
          tenantId,
          type: "NEW_BOOKING",
          title: `New Booking: ${customer.name}`,
          message: `${customer.name} booked ${service.name} for ${date} at ${startTime}.`,
          link: `/dashboard/bookings`,
        },
      });

      return { booking: bookingRecord, lead: leadRecord };
    });

    // 8. Automated WhatsApp / SMS confirmation message (Section 22, 29, 52)
    const confirmationText = `Hi ${customer.name},\n\nYour appointment with ${form.tenant.name} is confirmed!\n\nService: ${service.name}\nDate: ${formatBdDate(appointmentDate)}\nTime: ${startTime}\nBooking ID: ${bookingNumber}\n\nReply to this message if you need to reschedule or have questions.`;

    const recipientPhone = customer.whatsapp || customer.phone;
    // Dispatch confirmation via WhatsApp first if available, else fallback to SMS
    whatsAppService.send({
      tenantId,
      leadId: lead.id,
      bookingId: booking.id,
      to: recipientPhone,
      content: confirmationText,
    }).catch((err) => {
      console.error("Automated WhatsApp confirmation failed, sending SMS fallback:", err);
      smsService.send({
        tenantId,
        leadId: lead.id,
        bookingId: booking.id,
        to: customer.phone,
        content: `Booking Confirmed: ${service.name} with ${form.tenant.name} on ${date} at ${startTime}. ID: ${bookingNumber}`,
      });
    });

    return NextResponse.json({
      success: true,
      bookingNumber,
      serviceName: service.name,
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
