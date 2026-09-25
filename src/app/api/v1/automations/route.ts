import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";

const DEFAULT_AUTOMATIONS = [
  {
    name: "Instant Booking Confirmation (WhatsApp)",
    trigger: "BOOKING_CONFIRMED",
    conditions: { minPrice: 0 },
    actions: [
      {
        type: "SEND_WHATSAPP",
        template:
          "Hi {{customerName}}, your appointment for {{serviceName}} on {{date}} at {{time}} is confirmed!",
      },
    ],
    isActive: true,
  },
  {
    name: "24-Hour Appointment Reminder (SMS)",
    trigger: "24H_BEFORE_BOOKING",
    conditions: {},
    actions: [
      {
        type: "SEND_SMS",
        template:
          "Reminder: You have an appointment tomorrow at {{time}} for {{serviceName}}.",
      },
    ],
    isActive: true,
  },
  {
    name: "New Lead Instant Auto-Reply",
    trigger: "LEAD_CREATED",
    conditions: {},
    actions: [
      {
        type: "SEND_WHATSAPP",
        template:
          "Hello {{customerName}}, thank you for reaching out! Our team will contact you shortly.",
      },
    ],
    isActive: false,
  },
];

export async function GET() {
  try {
    const session = await requireTenant();
    const tenantId = session.tenantId;

    let automations = await prisma.automation.findMany({
      where: { tenantId },
      include: {
        _count: { select: { runs: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Seed default automations if none exist yet for this tenant
    if (automations.length === 0) {
      await prisma.automation.createMany({
        data: DEFAULT_AUTOMATIONS.map((a) => ({
          tenantId,
          name: a.name,
          trigger: a.trigger,
          conditions: a.conditions,
          actions: a.actions,
          isActive: a.isActive,
        })),
      });

      automations = await prisma.automation.findMany({
        where: { tenantId },
        include: {
          _count: { select: { runs: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({ automations });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load automations" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireTenant();
    const body = await req.json();
    const { name, trigger, actionType, messageTemplate } = body;

    if (!name || !trigger) {
      return NextResponse.json(
        { error: "Name and trigger are required" },
        { status: 400 }
      );
    }

    const automation = await prisma.automation.create({
      data: {
        tenantId: session.tenantId,
        name,
        trigger,
        conditions: {},
        actions: [
          {
            type: actionType || "SEND_WHATSAPP",
            template:
              messageTemplate ||
              "Hi {{customerName}}, thank you for choosing our service!",
          },
        ],
        isActive: true,
      },
      include: {
        _count: { select: { runs: true } },
      },
    });

    return NextResponse.json({ success: true, automation });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create automation" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireTenant();
    const { automationId, isActive, name, trigger, actions } = await req.json();

    if (!automationId) {
      return NextResponse.json(
        { error: "automationId is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.automation.findFirst({
      where: { id: automationId, tenantId: session.tenantId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Automation not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.automation.update({
      where: { id: automationId },
      data: {
        ...(typeof isActive === "boolean" ? { isActive } : {}),
        ...(name ? { name } : {}),
        ...(trigger ? { trigger } : {}),
        ...(actions ? { actions } : {}),
      },
    });

    return NextResponse.json({ success: true, automation: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update automation" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await requireTenant();
    const { searchParams } = new URL(req.url);
    const automationId = searchParams.get("automationId");

    if (!automationId) {
      return NextResponse.json(
        { error: "automationId is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.automation.findFirst({
      where: { id: automationId, tenantId: session.tenantId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Automation not found" },
        { status: 404 }
      );
    }

    await prisma.automation.delete({ where: { id: automationId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete automation" },
      { status: 500 }
    );
  }
}
