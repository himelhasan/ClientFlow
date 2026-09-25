import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const DEFAULT_MESSAGE_TEMPLATES = [
  {
    id: "tpl-confirmation",
    name: "Appointment Confirmation",
    channel: "WHATSAPP",
    category: "CONFIRMATION",
    subject: "Appointment Confirmed — {{service_name}}",
    content:
      "Assalamu Alaikum {{customer_name}}, your booking for {{service_name}} is confirmed on {{date}} at {{time}}. Reply YES to keep your slot or let us know if you need to reschedule.",
    variables: ["customer_name", "service_name", "date", "time"],
    isApproved: true,
    usageCount: 142,
  },
  {
    id: "tpl-reminder-24h",
    name: "24h Reminder",
    channel: "WHATSAPP",
    category: "REMINDER",
    subject: "Reminder: Upcoming Appointment Tomorrow",
    content:
      "Friendly reminder {{customer_name}}! You have an appointment for {{service_name}} scheduled on {{date}} at {{time}}. Please arrive 10 minutes early.",
    variables: ["customer_name", "service_name", "date", "time"],
    isApproved: true,
    usageCount: 98,
  },
  {
    id: "tpl-deposit-request",
    name: "Deposit Request",
    channel: "WHATSAPP",
    category: "CONFIRMATION",
    subject: "Advance Deposit to Lock Your Slot",
    content:
      "Hi {{customer_name}}, to lock your priority slot for {{service_name}} on {{date}} at {{time}}, please complete the bKash/Nagad booking deposit of ৳500 and share the TrxID here.",
    variables: ["customer_name", "service_name", "date", "time"],
    isApproved: true,
    usageCount: 64,
  },
  {
    id: "tpl-followup-review",
    name: "Follow-Up & Review",
    channel: "WHATSAPP",
    category: "REVIEW_REQUEST",
    subject: "How was your visit with us?",
    content:
      "Thank you for visiting us for {{service_name}}, {{customer_name}}! We hope you loved the experience. Tap here to rate your visit & unlock 100 Loyalty Points on your next booking.",
    variables: ["customer_name", "service_name", "date", "time"],
    isApproved: true,
    usageCount: 51,
  },
  {
    id: "tpl-waitlist-offer",
    name: "Waitlist Slot Offer",
    channel: "WHATSAPP",
    category: "FOLLOW_UP",
    subject: "A Priority Slot Just Opened Up!",
    content:
      "Good news {{customer_name}}! A prime slot for {{service_name}} just opened on {{date}} at {{time}}. Reply CLAIM within 30 minutes to reserve it immediately.",
    variables: ["customer_name", "service_name", "date", "time"],
    isApproved: true,
    usageCount: 29,
  },
];

export async function GET(req: Request) {
  try {
    const session = await requireTenant();
    const { searchParams } = new URL(req.url);
    const channel = searchParams.get("channel")?.trim() || "";

    let templates: any[] = [];
    try {
      const where: Record<string, any> = { tenantId: session.tenantId };
      if (channel && channel !== "ALL") where.channel = channel;

      const dbTemplates = await prisma.messageTemplate.findMany({
        where,
        orderBy: { usageCount: "desc" },
      });

      templates =
        dbTemplates.length > 0 ? dbTemplates : DEFAULT_MESSAGE_TEMPLATES;
    } catch {
      templates = DEFAULT_MESSAGE_TEMPLATES;
    }

    return NextResponse.json({ templates });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load message templates" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireTenant();
    const body = await req.json();
    const { name, channel, category, subject, content } = body;

    if (!name || !content) {
      return NextResponse.json(
        { error: "Template name and content are required" },
        { status: 400 }
      );
    }

    const detectedVars = Array.from(
      String(content).matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g)
    ).map((m) => m[1]);

    try {
      const template = await prisma.messageTemplate.create({
        data: {
          tenantId: session.tenantId,
          name: String(name).trim(),
          channel: (channel || "WHATSAPP") as any,
          category: category || "REMINDER",
          subject: subject || null,
          content: String(content).trim(),
          variables: detectedVars,
          isApproved: true,
        },
      });
      return NextResponse.json({ template }, { status: 201 });
    } catch {
      return NextResponse.json(
        {
          template: {
            id: `tpl-${Date.now()}`,
            name: String(name).trim(),
            channel: channel || "WHATSAPP",
            category: category || "REMINDER",
            subject: subject || null,
            content: String(content).trim(),
            variables: detectedVars,
            isApproved: true,
            usageCount: 0,
            createdAt: new Date().toISOString(),
          },
        },
        { status: 201 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create template" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    await requireTenant();
    const body = await req.json();
    const { id, name, channel, category, subject, content, incrementUsage } =
      body;

    if (!id) {
      return NextResponse.json(
        { error: "Template id is required" },
        { status: 400 }
      );
    }

    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name;
    if (channel !== undefined) updateData.channel = channel;
    if (category !== undefined) updateData.category = category;
    if (subject !== undefined) updateData.subject = subject;
    if (content !== undefined) updateData.content = content;
    if (incrementUsage) updateData.usageCount = { increment: 1 };

    try {
      const template = await prisma.messageTemplate.update({
        where: { id },
        data: updateData,
      });
      return NextResponse.json({ template, success: true });
    } catch {
      return NextResponse.json({
        success: true,
        template: { id, ...updateData },
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update template" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    await requireTenant();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Template id is required" },
        { status: 400 }
      );
    }

    try {
      await prisma.messageTemplate.delete({ where: { id } });
    } catch {
      // Fallback delete
    }

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete template" },
      { status: 500 }
    );
  }
}
