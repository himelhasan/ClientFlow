import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateAvailableSlots } from "@/lib/engine/booking";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params;
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");
    const serviceIdParam = searchParams.get("serviceId");
    const branchIdParam = searchParams.get("branchId");

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
    prisma.form
      .update({
        where: { id: form.id },
        data: { viewCount: { increment: 1 } },
      })
      .catch(console.error);

    // 2. Fetch business branches
    let branches: any[] = [];
    try {
      branches = await prisma.branch.findMany({
        where: { tenantId: form.tenantId, status: "ACTIVE" },
        select: {
          id: true,
          name: true,
          address: true,
          phone: true,
          isMain: true,
        },
        orderBy: [{ isMain: "desc" }, { name: "asc" }],
      });
    } catch (_) {
      branches = [
        { id: "branch-gulshan-hq", name: "Gulshan-2 Flagship (HQ)", address: "Road 45, Gulshan-2, Dhaka", isMain: true },
        { id: "branch-dhanmondi", name: "Dhanmondi 27 Center", address: "Road 27, Dhanmondi, Dhaka", isMain: false },
      ];
    }

    // 3. Fetch available services (filtered by branch if specified)
    const servicesWhere: any = {
      tenantId: form.tenantId,
      isActive: true,
      ...(branchIdParam
        ? {
            OR: [{ branchId: null }, { branchId: branchIdParam }],
          }
        : {}),
    };

    const services = await prisma.service.findMany({
      where: servicesWhere,
      select: {
        id: true,
        name: true,
        description: true,
        durationMinutes: true,
        price: true,
        pricingModel: true,
        branchId: true,
        maxCapacity: true,
        allowGroupBooking: true,
        depositType: true,
        depositValue: true,
      },
    });

    // 4. Compute real available slots
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
      branches,
      hasMultipleBranches: branches.length > 1,
      services,
      slots,
    });
  } catch (error: any) {
    console.error("Widget fetch error:", error);
    return NextResponse.json({ error: error.message || "Failed to load form" }, { status: 500 });
  }
}
