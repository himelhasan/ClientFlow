import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await requireTenant();
    const forms = await prisma.form.findMany({
      where: { tenantId: session.tenantId },
      include: {
        fields: { orderBy: { order: "asc" } },
        _count: { select: { submissions: true, bookings: true, leads: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ forms });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load forms" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireTenant();
    const body = await req.json();
    const { name, title, description, type, designConfig } = body;

    if (!name || !title) {
      return NextResponse.json({ error: "Form name and title are required" }, { status: 400 });
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") + "-" + Math.random().toString(36).substring(2, 6);

    const form = await prisma.form.create({
      data: {
        tenantId: session.tenantId,
        name,
        slug,
        title,
        description,
        type: type || "APPOINTMENT",
        designConfig: designConfig || {
          primaryColor: "#059669",
          backgroundColor: "#ffffff",
          textColor: "#111827",
          borderRadius: "8px",
          buttonText: "Book Appointment",
        },
        fields: {
          create: [
            {
              tenantId: session.tenantId,
              fieldId: "service_id",
              type: "service_selector",
              label: "Select Service",
              required: true,
              order: 1,
            },
            {
              tenantId: session.tenantId,
              fieldId: "booking_date_time",
              type: "date_time",
              label: "Appointment Date & Time",
              required: true,
              order: 2,
            },
            {
              tenantId: session.tenantId,
              fieldId: "customer_name",
              type: "text",
              label: "Full Name",
              placeholder: "Enter full name",
              required: true,
              order: 3,
            },
            {
              tenantId: session.tenantId,
              fieldId: "customer_phone",
              type: "phone",
              label: "Mobile Number",
              placeholder: "017XXXXXXXX",
              required: true,
              order: 4,
            },
          ],
        },
      },
      include: { fields: true },
    });

    return NextResponse.json({ success: true, form });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create form" }, { status: 500 });
  }
}
