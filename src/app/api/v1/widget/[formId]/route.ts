import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateAvailableSlots } from "@/lib/engine/booking";

export async function GET(req: Request, { params }: { params: { formId: string } }) {
  try {
    const { formId } = params;
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");
    const serviceIdParam = searchParams.get("serviceId");

    // 1. Fetch form by ID or Slug
    const form = await prisma.form.findFirst({
      where: {
        OR: [{ id: formId }, { slug: formId }],
        status: "PUBLISHED",
      },
      include: {
        fields: {
          orderBy: { order: "asc" },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            phone: true,
            whatsapp: true,
            category: true,
            city: true,
            currency: true,
            timezone: true,
          },
        },
      },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found or unpublished" }, { status: 404 });
    }

    // Increment view count asynchronously
    prisma.form.update({
      where: { id: form.id },
      data: { viewCount: { increment: 1 } },
    }).catch(console.error);

    // 2. Fetch available services for this business
    const services = await prisma.service.findMany({
      where: {
        tenantId: form.tenantId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        durationMinutes: true,
        price: true,
        pricingModel: true,
      },
    });

    // 3. If date and serviceId are provided, compute real available slots
    let slots = null;
    if (dateParam && serviceIdParam) {
      slots = await calculateAvailableSlots({
        tenantId: form.tenantId,
        serviceId: serviceIdParam,
        dateStr: dateParam,
      });
    }

    return NextResponse.json({
      form: {
        id: form.id,
        name: form.name,
        slug: form.slug,
        title: form.title,
        description: form.description,
        designConfig: form.designConfig,
        fields: form.fields,
      },
      business: form.tenant,
      services,
      slots,
    });
  } catch (error: any) {
    console.error("Widget fetch error:", error);
    return NextResponse.json({ error: error.message || "Failed to load form" }, { status: 500 });
  }
}
