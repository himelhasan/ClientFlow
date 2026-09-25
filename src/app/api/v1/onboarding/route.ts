import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { normalizeBdPhone } from "@/lib/utils/bangladesh";

export async function POST(req: Request) {
  try {
    const session = await requireTenant();
    const body = await req.json();

    const {
      // Step 1: Business Info
      businessName,
      category,
      description,
      phone,
      whatsapp,
      email,
      address,
      city,
      website,

      // Step 2: Requirements
      acceptsAppointments = true,
      acceptsServiceRequests = false,
      acceptsQuotes = false,
      hasStaff = false,
      acceptsOnlinePayment = false,
      usesWhatsApp = true,
      usesSMS = true,
      usesFacebook = false,
      usesInstagram = false,

      // Step 3: First Service & Form
      firstServiceName = "General Consultation",
      firstServiceDuration = 30,
      firstServicePrice = 500,
    } = body;

    const tenantId = session.tenantId;

    // Update business info and enabled modules
    const updatedBusiness = await prisma.business.update({
      where: { id: tenantId },
      data: {
        ...(businessName ? { name: businessName } : {}),
        category: category || "Other",
        description,
        phone: phone || "01700000000",
        normalizedPhone: phone ? normalizeBdPhone(phone) : "+8801700000000",
        whatsapp: whatsapp ? normalizeBdPhone(whatsapp) : null,
        email,
        address,
        city: city || "Dhaka",
        website,
        activeModules: {
          appointments: acceptsAppointments,
          serviceRequests: acceptsServiceRequests,
          quotes: acceptsQuotes,
          staff: hasStaff,
          payments: acceptsOnlinePayment,
          whatsapp: usesWhatsApp,
          sms: usesSMS,
          facebook: usesFacebook,
          instagram: usesInstagram,
        },
      },
    });

    // Create First Service if none exists
    const existingService = await prisma.service.findFirst({ where: { tenantId } });
    let service = existingService;
    if (!existingService && firstServiceName) {
      service = await prisma.service.create({
        data: {
          tenantId,
          name: firstServiceName,
          durationMinutes: Number(firstServiceDuration) || 30,
          price: Number(firstServicePrice) || 0,
          category,
          isActive: true,
        },
      });
    }

    // Create Initial Embeddable Form with fields
    const existingForm = await prisma.form.findFirst({ where: { tenantId } });
    let form = existingForm;
    if (!existingForm) {
      const formSlug = "book-" + Math.random().toString(36).substring(2, 7);
      form = await prisma.form.create({
        data: {
          tenantId,
          name: "Direct Appointment Booking",
          slug: formSlug,
          type: "APPOINTMENT",
          title: `Book with ${updatedBusiness.name}`,
          description: "Select an appointment slot and fill in your details.",
          isMultiStep: false,
          status: "PUBLISHED",
          designConfig: {
            primaryColor: "#059669", // emerald-600
            backgroundColor: "#ffffff",
            textColor: "#111827",
            borderRadius: "8px",
            buttonText: "Confirm Booking",
            fontFamily: "Inter, sans-serif",
          },
          fields: {
            create: [
              {
                tenantId,
                fieldId: "service_id",
                type: "service_selector",
                label: "Select Service",
                required: true,
                order: 1,
              },
              {
                tenantId,
                fieldId: "booking_date_time",
                type: "date_time",
                label: "Select Date & Time",
                required: true,
                order: 2,
              },
              {
                tenantId,
                fieldId: "customer_name",
                type: "text",
                label: "Full Name",
                placeholder: "e.g. Tanvir Ahmed",
                required: true,
                order: 3,
              },
              {
                tenantId,
                fieldId: "customer_phone",
                type: "phone",
                label: "Phone Number (Bangladeshi Mobile)",
                placeholder: "017XXXXXXXX",
                required: true,
                order: 4,
              },
              {
                tenantId,
                fieldId: "customer_whatsapp",
                type: "whatsapp",
                label: "WhatsApp Number (optional)",
                placeholder: "01XXXXXXXXX",
                required: false,
                order: 5,
              },
              {
                tenantId,
                fieldId: "notes",
                type: "textarea",
                label: "Any special instructions or notes",
                placeholder: "Write here...",
                required: false,
                order: 6,
              },
            ],
          },
        },
        include: { fields: true },
      });
    }

    return NextResponse.json({
      success: true,
      business: updatedBusiness,
      service,
      form,
    });
  } catch (error: any) {
    console.error("Onboarding setup error:", error);
    return NextResponse.json({ error: error.message || "Failed to complete onboarding" }, { status: 500 });
  }
}
