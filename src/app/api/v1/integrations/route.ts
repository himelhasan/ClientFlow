import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await requireTenant();
    const tenantId = session.tenantId;

    const [integrations, webhooks] = await Promise.all([
      prisma.integration.findMany({
        where: { tenantId },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.webhook.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      tenantId,
      integrations,
      webhooks,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load integrations" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireTenant();
    const tenantId = session.tenantId;
    const body = await req.json();

    // If registering an outgoing developer webhook
    if (body.entity === "WEBHOOK") {
      const { url, events } = body;
      if (!url) {
        return NextResponse.json(
          { error: "Webhook URL is required" },
          { status: 400 }
        );
      }

      const secret =
        "whsec_" +
        Math.random().toString(36).substring(2, 12) +
        Math.random().toString(36).substring(2, 12);

      const webhook = await prisma.webhook.create({
        data: {
          tenantId,
          url,
          secret,
          events: events || ["BOOKING_CREATED", "LEAD_CREATED", "PAYMENT_PAID"],
          isActive: true,
        },
      });

      return NextResponse.json({ success: true, webhook });
    }

    // Otherwise upsert a provider integration (WhatsApp, Facebook Page, Instagram, SMS Gateway, bKash)
    const { provider, credentials, status } = body;
    if (!provider) {
      return NextResponse.json(
        { error: "provider is required" },
        { status: 400 }
      );
    }

    const integration = await prisma.integration.upsert({
      where: {
        tenantId_provider: {
          tenantId,
          provider,
        },
      },
      update: {
        credentials: credentials || {},
        status: status || "ACTIVE",
      },
      create: {
        tenantId,
        provider,
        credentials: credentials || {},
        status: status || "ACTIVE",
      },
    });

    return NextResponse.json({ success: true, integration });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to save integration" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await requireTenant();
    const { searchParams } = new URL(req.url);
    const webhookId = searchParams.get("webhookId");
    const integrationId = searchParams.get("integrationId");

    if (webhookId) {
      await prisma.webhook.deleteMany({
        where: { id: webhookId, tenantId: session.tenantId },
      });
      return NextResponse.json({ success: true });
    }

    if (integrationId) {
      await prisma.integration.deleteMany({
        where: { id: integrationId, tenantId: session.tenantId },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "webhookId or integrationId is required" },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete integration" },
      { status: 500 }
    );
  }
}
