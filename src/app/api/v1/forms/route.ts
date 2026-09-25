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
    const { name, title, description, type, designConfig, fields } = body;

    if (!name || !title) {
      return NextResponse.json({ error: "Form name and title are required" }, { status: 400 });
    }

    const slug =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") +
      "-" +
      Math.random().toString(36).substring(2, 6);

    const defaultFields = [
      { fieldId: "service_id", type: "service_selector", label: "Select Service", required: true, order: 1 },
      { fieldId: "booking_date_time", type: "date_time", label: "Appointment Date & Time", required: true, order: 2 },
      { fieldId: "customer_name", type: "text", label: "Full Name", placeholder: "Enter full name", required: true, order: 3 },
      { fieldId: "customer_phone", type: "phone", label: "Mobile Number", placeholder: "017XXXXXXXX", required: true, order: 4 },
    ];

    const fieldsToCreate = (fields && fields.length > 0 ? fields : defaultFields).map(
      (f: any, i: number) => ({
        tenantId: session.tenantId,
        fieldId: f.fieldId || `field_${i + 1}`,
        type: f.type || "text",
        label: f.label || "",
        placeholder: f.placeholder || null,
        required: f.required ?? false,
        helpText: f.helpText || null,
        order: f.order ?? i + 1,
      })
    );

    const form = await prisma.form.create({
      data: {
        tenantId: session.tenantId,
        name,
        slug,
        title,
        description: description || null,
        type: type || "APPOINTMENT",
        status: "PUBLISHED",
        designConfig: designConfig || {
          primaryColor: "#059669",
          backgroundColor: "#ffffff",
          textColor: "#111827",
          borderRadius: "8px",
          buttonText: "Book Appointment",
        },
        fields: { create: fieldsToCreate },
      },
      include: { fields: { orderBy: { order: "asc" } } },
    });

    return NextResponse.json({ success: true, form });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create form" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireTenant();
    const body = await req.json();
    const { formId, name, title, description, status, designConfig, fields } = body;

    if (!formId) {
      return NextResponse.json({ error: "formId is required" }, { status: 400 });
    }

    const existing = await prisma.form.findFirst({
      where: { id: formId, tenantId: session.tenantId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    const updated = await prisma.form.update({
      where: { id: formId },
      data: {
        ...(name !== undefined && { name }),
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(designConfig !== undefined && { designConfig }),
      },
    });

    // If fields array provided, replace all fields
    if (fields && Array.isArray(fields)) {
      await prisma.formField.deleteMany({ where: { formId } });
      if (fields.length > 0) {
        await prisma.formField.createMany({
          data: fields.map((f: any, i: number) => ({
            tenantId: session.tenantId,
            formId,
            fieldId: f.fieldId || `field_${i + 1}`,
            type: f.type || "text",
            label: f.label || "",
            placeholder: f.placeholder || null,
            required: f.required ?? false,
            helpText: f.helpText || null,
            defaultValue: f.defaultValue || null,
            conditions: f.conditions || null,
            order: f.order ?? i + 1,
          })),
        });
      }
    }

    const result = await prisma.form.findUnique({
      where: { id: formId },
      include: { fields: { orderBy: { order: "asc" } } },
    });

    return NextResponse.json({ success: true, form: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update form" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await requireTenant();
    const { searchParams } = new URL(req.url);
    const formId = searchParams.get("formId");

    if (!formId) {
      return NextResponse.json({ error: "formId is required" }, { status: 400 });
    }

    const existing = await prisma.form.findFirst({
      where: { id: formId, tenantId: session.tenantId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Soft-delete: disable rather than hard delete (submissions reference this form)
    await prisma.form.update({
      where: { id: formId },
      data: { status: "DISABLED" },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete form" }, { status: 500 });
  }
}
