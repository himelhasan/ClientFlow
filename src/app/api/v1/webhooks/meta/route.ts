import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { findOrCreateCustomer } from "@/lib/engine/customer";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken =
    process.env.META_WEBHOOK_VERIFY_TOKEN || "clientflow_meta_verify_2026";

  if (mode === "subscribe" && token === verifyToken) {
    return new Response(challenge || "OK", { status: 200 });
  }

  return NextResponse.json(
    { status: "ready", endpoint: "ClientFlow Meta Social & WhatsApp Webhook" },
    { status: 200 }
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Resolve tenantId (from body.tenantId or fallback to first active business)
    let tenantId = body.tenantId;
    if (!tenantId) {
      const firstBusiness = await prisma.business.findFirst({
        orderBy: { createdAt: "asc" },
      });
      if (!firstBusiness) {
        return NextResponse.json(
          { error: "No active business tenant found" },
          { status: 404 }
        );
      }
      tenantId = firstBusiness.id;
    }

    // 2. Parse either normalized event or Meta Graph API webhook structure
    const channelRaw = (body.channel || "WHATSAPP").toUpperCase();
    const customerName = body.customerName || "Social Visitor";
    const customerPhone = body.customerPhone || "01711000000";
    const messageContent =
      body.messageContent ||
      "Hi, I saw your page on Facebook and would like to book an appointment.";
    const leadTitle =
      body.title || `Inbound ${channelRaw} inquiry from ${customerName}`;

    // 3. Deduplicate or create customer by normalized phone
    const customer = await findOrCreateCustomer({
      tenantId,
      name: customerName,
      phone: customerPhone,
    });

    // 4. Map channel to LeadSource & MessageChannel
    const leadSource = ["FACEBOOK", "INSTAGRAM", "WHATSAPP", "SMS", "WEBSITE"].includes(
      channelRaw
    )
      ? (channelRaw as any)
      : "FACEBOOK";

    const msgChannel = ["WHATSAPP", "SMS", "EMAIL", "FACEBOOK", "INSTAGRAM", "WEBSITE"].includes(
      channelRaw
    )
      ? (channelRaw as any)
      : "WHATSAPP";

    // 5. Create Lead + Conversation + Inbound Message inside a transaction
    const result = await prisma.$transaction(async (tx) => {
      const lead = await tx.lead.create({
        data: {
          tenantId,
          customerId: customer.id,
          source: leadSource,
          status: "NEW",
          title: leadTitle,
          notes: messageContent,
        },
      });

      await tx.leadEvent.create({
        data: {
          tenantId,
          leadId: lead.id,
          type: `WEBHOOK_${leadSource}_CAPTURED`,
          description: `Captured inbound lead via ${leadSource}: "${messageContent.slice(0, 80)}"`,
        },
      });

      // Find or create Conversation for Unified Inbox
      let conversation = await tx.conversation.findFirst({
        where: {
          tenantId,
          customerId: customer.id,
          channel: msgChannel,
        },
      });

      if (conversation) {
        conversation = await tx.conversation.update({
          where: { id: conversation.id },
          data: {
            unreadCount: { increment: 1 },
            lastMessageAt: new Date(),
          },
        });
      } else {
        conversation = await tx.conversation.create({
          data: {
            tenantId,
            customerId: customer.id,
            channel: msgChannel,
            unreadCount: 1,
            lastMessageAt: new Date(),
          },
        });
      }

      const inboundMessage = await tx.message.create({
        data: {
          tenantId,
          conversationId: conversation.id,
          leadId: lead.id,
          direction: "INBOUND",
          channel: msgChannel,
          messageType: "CUSTOMER_SERVICE",
          content: messageContent,
          status: "DELIVERED",
          sentAt: new Date(),
        },
      });

      return { lead, conversation, inboundMessage };
    });

    return NextResponse.json({
      success: true,
      leadId: result.lead.id,
      conversationId: result.conversation.id,
      messageId: result.inboundMessage.id,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to process webhook" },
      { status: 500 }
    );
  }
}
