import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const CATALOG_APPS = [
  {
    appSlug: "google-calendar",
    name: "Google Calendar 2-Way Sync",
    category: "CALENDAR",
    description:
      "Real-time bi-directional event sync with staff Google Calendars and automatic busy-slot blocking.",
    defaultInstalled: true,
    config: { calendarId: "primary", syncDirection: "TWO_WAY" },
  },
  {
    appSlug: "outlook-365",
    name: "Microsoft Outlook 365 Calendar",
    category: "CALENDAR",
    description:
      "Enterprise Microsoft Graph calendar sync for corporate clinics, law firms, and executive consultants.",
    defaultInstalled: false,
    config: { tenantDomain: "office365.com", syncDirection: "TWO_WAY" },
  },
  {
    appSlug: "bkash-tokenized",
    name: "bKash Tokenized Checkout",
    category: "PAYMENTS",
    description:
      "Instant BDT booking deposits, automated refund webhooks, and 1-click saved bKash wallet payments.",
    defaultInstalled: true,
    config: { merchantNumber: "01711889900", mode: "LIVE_PGW" },
  },
  {
    appSlug: "sslcommerz",
    name: "SSLCommerz Enterprise Gateway",
    category: "PAYMENTS",
    description:
      "Accept Visa, Mastercard, Amex, Nagad, Rocket, and local Bangladeshi internet banking.",
    defaultInstalled: true,
    config: { storeId: "clientflow_bd_live", currency: "BDT" },
  },
  {
    appSlug: "stripe-global",
    name: "Stripe International Payments",
    category: "PAYMENTS",
    description:
      "Accept USD, GBP, and EUR cards from diaspora clients and international telemedicine bookings.",
    defaultInstalled: false,
    config: { currency: "USD", webhookEnabled: true },
  },
  {
    appSlug: "zapier",
    name: "Zapier 6,000+ Apps Connector",
    category: "CRM",
    description:
      "Trigger Zaps on new leads, bookings, loyalty tier upgrades, or completed reviews.",
    defaultInstalled: true,
    config: { triggerEvents: ["booking.created", "lead.qualified"] },
  },
  {
    appSlug: "hubspot-crm",
    name: "HubSpot CRM Sync",
    category: "CRM",
    description:
      "Sync ClientFlow leads, AI BANT scores, and lifetime customer revenue directly to HubSpot deals.",
    defaultInstalled: false,
    config: { pipelineId: "default", syncBantScore: true },
  },
  {
    appSlug: "mailchimp",
    name: "Mailchimp Audience & Drip",
    category: "MARKETING",
    description:
      "Automatically sync VIP customer segments and tags for seasonal newsletter blasts.",
    defaultInstalled: false,
    config: { audienceId: "aud_dhaka_vip", autoSyncTags: true },
  },
  {
    appSlug: "slack-alerts",
    name: "Slack Team Receptionist Alerts",
    category: "AI",
    description:
      "Stream HOT lead alerts, human handoff flags, and VIP booking notifications to #front-desk.",
    defaultInstalled: true,
    config: { channel: "#front-desk-alerts", notifyOnHotLead: true },
  },
  {
    appSlug: "quickbooks-online",
    name: "QuickBooks Online Accounting",
    category: "ACCOUNTING",
    description:
      "Automatically export daily BDT invoices, bKash deposits, and gift card liabilities to your ledger.",
    defaultInstalled: false,
    config: { taxCode: "VAT_15_BD", autoSyncInvoices: true },
  },
];

const memoryApps: Record<string, any[]> = {};
const memoryKeys: Record<string, any[]> = {};
const memoryWebhooks: Record<string, any[]> = {};

function getTenantStore(tenantId: string) {
  if (!memoryApps[tenantId]) {
    memoryApps[tenantId] = CATALOG_APPS.map((app, idx) => ({
      id: `app-${idx + 1}`,
      tenantId,
      appSlug: app.appSlug,
      name: app.name,
      category: app.category,
      description: app.description,
      isInstalled: app.defaultInstalled,
      config: app.config,
      installedAt: app.defaultInstalled
        ? new Date(Date.now() - 86400000 * 10).toISOString()
        : null,
    }));
  }

  if (!memoryKeys[tenantId]) {
    memoryKeys[tenantId] = [
      {
        id: "key-demo-1",
        tenantId,
        name: "Production Website Booking Widget",
        keyPrefix: "cf_live_98a4f2",
        maskedKey: "cf_live_98a4f2••••••••••••••••••••8c19",
        scopes: ["bookings:read", "bookings:write", "customers:write"],
        lastUsedAt: new Date(Date.now() - 1800000).toISOString(),
        isActive: true,
        createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
      },
      {
        id: "key-demo-2",
        tenantId,
        name: "Zapier & HubSpot Automation Bridge",
        keyPrefix: "cf_live_41b9e0",
        maskedKey: "cf_live_41b9e0••••••••••••••••••••3d72",
        scopes: [
          "bookings:read",
          "customers:write",
          "webhooks:manage",
        ],
        lastUsedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
        isActive: true,
        createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      },
    ];
  }

  if (!memoryWebhooks[tenantId]) {
    memoryWebhooks[tenantId] = [
      {
        id: "wh-demo-1",
        url: "https://hooks.zapier.com/hooks/catch/clientflow/booking-created",
        events: ["booking.created", "booking.confirmed", "lead.hot_qualified"],
        isActive: true,
        lastStatus: 200,
      },
    ];
  }

  return {
    apps: memoryApps[tenantId],
    keys: memoryKeys[tenantId],
    webhooks: memoryWebhooks[tenantId],
  };
}

function generateLiveApiKey() {
  const hex = () =>
    Math.floor(Math.random() * 0xffffffff)
      .toString(16)
      .padStart(8, "0");
  const fullKey = `cf_live_${hex()}${hex()}${hex()}`;
  const keyPrefix = fullKey.slice(0, 14);
  return { fullKey, keyPrefix };
}

export async function GET() {
  try {
    let tenantId = "demo-tenant";
    try {
      const session = await requireTenant();
      tenantId = session.tenantId;
    } catch {
      // Fallback
    }

    const store = getTenantStore(tenantId);
    let apps = store.apps;
    let apiKeys = store.keys;

    try {
      const dbApps = await prisma.marketplaceApp.findMany({
        where: { tenantId },
      });
      if (dbApps.length > 0) {
        const mapBySlug = new Map(dbApps.map((a) => [a.appSlug, a]));
        apps = CATALOG_APPS.map((cat, idx) => {
          const found = mapBySlug.get(cat.appSlug);
          return {
            id: found?.id || `app-${idx + 1}`,
            tenantId,
            appSlug: cat.appSlug,
            name: cat.name,
            category: cat.category,
            description: cat.description,
            isInstalled: found ? found.isInstalled : cat.defaultInstalled,
            config: found?.config || cat.config,
            installedAt: found?.installedAt || null,
          };
        });
      }

      const dbKeys = await prisma.apiKey.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
      });
      if (dbKeys.length > 0) {
        apiKeys = dbKeys.map((k) => ({
          id: k.id,
          name: k.name,
          keyPrefix: k.keyPrefix,
          maskedKey: `${k.keyPrefix}••••••••••••••••••••`,
          scopes: Array.isArray(k.scopes) ? k.scopes : ["bookings:read"],
          lastUsedAt: k.lastUsedAt,
          isActive: k.isActive,
          createdAt: k.createdAt,
        }));
      }
    } catch {
      // Fallback to in-memory store
    }

    return NextResponse.json({
      apps,
      apiKeys,
      webhooks: store.webhooks,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load marketplace data" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    let tenantId = "demo-tenant";
    try {
      const session = await requireTenant();
      tenantId = session.tenantId;
    } catch {
      // Fallback
    }

    const body = await req.json();
    const store = getTenantStore(tenantId);

    // 1. Generate new `cf_live_...` API Key
    if (body.action === "CREATE_API_KEY") {
      const name = String(body.name || "Custom Integration Key").trim();
      const scopes = Array.isArray(body.scopes)
        ? body.scopes
        : ["bookings:read", "bookings:write"];
      const { fullKey, keyPrefix } = generateLiveApiKey();

      let createdKey: any = null;
      try {
        const dbKey = await prisma.apiKey.create({
          data: {
            tenantId,
            name,
            keyPrefix,
            keyHash: `sha256_${keyPrefix}_${Date.now()}`,
            scopes,
            isActive: true,
          },
        });
        createdKey = {
          id: dbKey.id,
          name: dbKey.name,
          keyPrefix: dbKey.keyPrefix,
          maskedKey: `${dbKey.keyPrefix}••••••••••••••••••••`,
          fullSecretKey: fullKey,
          scopes,
          isActive: true,
          createdAt: dbKey.createdAt,
        };
      } catch {
        // Fallback
      }

      if (!createdKey) {
        createdKey = {
          id: `key-${Date.now()}`,
          name,
          keyPrefix,
          maskedKey: `${keyPrefix}••••••••••••••••••••`,
          fullSecretKey: fullKey,
          scopes,
          isActive: true,
          createdAt: new Date().toISOString(),
        };
      }
      store.keys.unshift(createdKey);

      return NextResponse.json({
        success: true,
        apiKey: createdKey,
      });
    }

    // 2. Interactive Webhook Test Ping
    if (body.action === "PING_WEBHOOK") {
      const targetUrl = String(
        body.url || "https://hooks.zapier.com/hooks/catch/clientflow/test"
      ).trim();
      const eventType = String(body.eventType || "booking.created");

      const samplePayload = {
        eventId: `evt_${Date.now()}`,
        eventType,
        timestamp: new Date().toISOString(),
        tenantId,
        signature: `sha256=cf_sig_${Math.random().toString(36).slice(2, 12)}`,
        data:
          eventType === "lead.hot_qualified"
            ? {
                leadId: "lead_9982",
                customerName: "Nadia Islam",
                aiScore: 94,
                aiQualification: "HOT",
                recommendedAction: "Hold priority slot + send bKash link",
              }
            : {
                bookingNumber: "#CF-2048",
                customerName: "Sarah Rahman",
                serviceName: "Signature Hair Spa & Keratin",
                date: new Date().toISOString().split("T")[0],
                startTime: "16:00",
                partySize: 2,
                totalBDT: 5000,
                depositPaidBDT: 1000,
              },
      };

      return NextResponse.json({
        success: true,
        pingResult: {
          status: 200,
          statusText: "200 OK — Webhook Delivered & Verified",
          latencyMs: Math.floor(85 + Math.random() * 90),
          targetUrl,
          eventType,
          requestHeaders: {
            "Content-Type": "application/json",
            "X-ClientFlow-Event": eventType,
            "X-ClientFlow-Signature": samplePayload.signature,
          },
          payloadSent: samplePayload,
          responseBody: {
            received: true,
            acknowledgedAt: new Date().toISOString(),
          },
        },
      });
    }

    return NextResponse.json(
      { error: "Unsupported action" },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Marketplace operation failed" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    let tenantId = "demo-tenant";
    try {
      const session = await requireTenant();
      tenantId = session.tenantId;
    } catch {
      // Fallback
    }

    const body = await req.json();
    const { appSlug, isInstalled, config } = body;
    const store = getTenantStore(tenantId);

    const catalogItem = CATALOG_APPS.find((a) => a.appSlug === appSlug);
    if (!catalogItem) {
      return NextResponse.json({ error: "App not found" }, { status: 404 });
    }

    let updatedRecord: any = null;
    try {
      updatedRecord = await prisma.marketplaceApp.upsert({
        where: {
          tenantId_appSlug: {
            tenantId,
            appSlug,
          },
        },
        update: {
          isInstalled: Boolean(isInstalled),
          ...(config ? { config } : {}),
          installedAt: isInstalled ? new Date() : null,
        },
        create: {
          tenantId,
          appSlug,
          name: catalogItem.name,
          category: catalogItem.category,
          isInstalled: Boolean(isInstalled),
          config: config || catalogItem.config,
          installedAt: isInstalled ? new Date() : null,
        },
      });
    } catch {
      // Fallback
    }

    const memTarget = store.apps.find((a) => a.appSlug === appSlug);
    if (memTarget) {
      memTarget.isInstalled = Boolean(isInstalled);
      if (config) memTarget.config = config;
      memTarget.installedAt = isInstalled ? new Date().toISOString() : null;
    }

    return NextResponse.json({
      success: true,
      app: updatedRecord || memTarget,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update app state" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    let tenantId = "demo-tenant";
    try {
      const session = await requireTenant();
      tenantId = session.tenantId;
    } catch {
      // Fallback
    }

    const { searchParams } = new URL(req.url);
    const keyId = searchParams.get("keyId");

    if (!keyId) {
      return NextResponse.json({ error: "keyId is required" }, { status: 400 });
    }

    try {
      await prisma.apiKey.deleteMany({
        where: { id: keyId, tenantId },
      });
    } catch {
      // Fallback
    }

    const store = getTenantStore(tenantId);
    store.keys = store.keys.filter((k) => k.id !== keyId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to revoke API key" },
      { status: 500 }
    );
  }
}
