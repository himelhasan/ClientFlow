import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  generateOAuthUrl,
  syncCalendarConnection,
  resolveCalendarConflicts,
  getFallbackConnections,
  getFallbackEvents,
  type CalendarProvider,
  type SyncDirection,
  type ConflictPolicy,
} from "@/lib/engine/calendar-sync";

export async function GET() {
  let tenantId = "demo-tenant";
  try {
    const session = await requireTenant();
    tenantId = session.tenantId;
  } catch (_) {}

  try {
    let connections = await prisma.calendarSyncConnection.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });

    // Seed default demo connections into Prisma if tenant has none yet
    if (connections.length === 0) {
      const defaults = getFallbackConnections(tenantId);
      for (const def of defaults) {
        await prisma.calendarSyncConnection.create({
          data: {
            tenantId,
            provider: def.provider,
            accountEmail: def.accountEmail,
            calendarId: def.calendarId,
            syncDirection: def.syncDirection,
            conflictPolicy: def.conflictPolicy,
            status: def.status,
            lastSyncedAt: def.lastSyncedAt ? new Date(def.lastSyncedAt) : new Date(),
            webhookChannelId: def.webhookChannelId,
          },
        });
      }
      connections = await prisma.calendarSyncConnection.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
      });
    }

    let events = await prisma.externalCalendarEvent.findMany({
      where: { tenantId },
      orderBy: { startTime: "desc" },
      take: 40,
    });

    if (events.length === 0 && connections.length > 0) {
      const defEvents = getFallbackEvents(tenantId);
      for (let i = 0; i < defEvents.length; i++) {
        const evt = defEvents[i];
        const targetConn = connections[i % connections.length];
        await prisma.externalCalendarEvent.create({
          data: {
            tenantId,
            connectionId: targetConn.id,
            externalEventId: evt.externalEventId,
            bookingId: evt.bookingId || null,
            title: evt.title,
            startTime: new Date(evt.startTime),
            endTime: new Date(evt.endTime),
            isBusy: evt.isBusy,
            direction: evt.direction,
          },
        });
      }
      events = await prisma.externalCalendarEvent.findMany({
        where: { tenantId },
        orderBy: { startTime: "desc" },
        take: 40,
      });
    }

    return NextResponse.json({
      connections,
      events,
      architecture: {
        googleProtocol: "Google Calendar API v3 (Push Webhook Channels + syncToken Delta)",
        outlookProtocol: "Microsoft Graph Calendar API v1.0 (Delta Query + Change Notifications)",
      },
    });
  } catch (_) {
    // Fallback if Prisma tables are not migrated yet
    return NextResponse.json({
      connections: getFallbackConnections(tenantId),
      events: getFallbackEvents(tenantId),
      architecture: {
        googleProtocol: "Google Calendar API v3 (Push Webhook Channels + syncToken Delta)",
        outlookProtocol: "Microsoft Graph Calendar API v1.0 (Delta Query + Change Notifications)",
      },
    });
  }
}

export async function POST(req: Request) {
  let tenantId = "demo-tenant";
  try {
    const session = await requireTenant();
    tenantId = session.tenantId;
  } catch (_) {}

  try {
    const body = await req.json();
    const {
      action = "CONNECT",
      provider = "GOOGLE_CALENDAR",
      accountEmail,
      calendarId = "primary",
      syncDirection = "TWO_WAY",
      conflictPolicy = "EXTERNAL_WINS",
      staffId,
      connectionId,
    } = body;

    if (action === "CONNECT") {
      const oauth = generateOAuthUrl(provider as CalendarProvider, tenantId, staffId);
      const email =
        accountEmail ||
        (provider === "GOOGLE_CALENDAR"
          ? "appointments.gcal@clientflow-clinic.bd"
          : "bookings.outlook@clientflow-clinic.bd");

      try {
        const existing = await prisma.calendarSyncConnection.findFirst({
          where: { tenantId, provider, accountEmail: email },
        });

        const connection = existing
          ? await prisma.calendarSyncConnection.update({
              where: { id: existing.id },
              data: {
                status: "CONNECTED",
                syncDirection,
                conflictPolicy,
                lastSyncedAt: new Date(),
              },
            })
          : await prisma.calendarSyncConnection.create({
              data: {
                tenantId,
                staffId: staffId || null,
                provider,
                accountEmail: email,
                calendarId,
                syncDirection,
                conflictPolicy,
                status: "CONNECTED",
                lastSyncedAt: new Date(),
                webhookChannelId: `${provider.toLowerCase()}_wh_${Date.now()}`,
              },
            });

        return NextResponse.json({
          success: true,
          connection,
          oauthUrl: oauth.oauthUrl,
          sandboxMode: oauth.sandboxMode,
        });
      } catch (_) {
        const fallbackConns = getFallbackConnections(tenantId);
        const newConn = {
          id: `conn-${provider.toLowerCase()}-${Date.now()}`,
          tenantId,
          staffId: staffId || null,
          provider,
          accountEmail: email,
          calendarId,
          syncDirection,
          conflictPolicy,
          status: "CONNECTED",
          lastSyncedAt: new Date().toISOString(),
          webhookChannelId: `${provider.toLowerCase()}_wh_${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        fallbackConns.unshift(newConn);
        return NextResponse.json({
          success: true,
          connection: newConn,
          oauthUrl: oauth.oauthUrl,
          sandboxMode: oauth.sandboxMode,
        });
      }
    }

    if (action === "SYNC_NOW") {
      let targetConnId = connectionId;
      if (!targetConnId) {
        try {
          const first = await prisma.calendarSyncConnection.findFirst({ where: { tenantId } });
          targetConnId = first?.id;
        } catch (_) {}
      }
      const syncResult = await syncCalendarConnection(
        targetConnId || getFallbackConnections(tenantId)[0].id,
        tenantId
      );
      return NextResponse.json({
        success: true,
        ...syncResult,
      });
    }

    if (action === "SIMULATE_CONFLICT") {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 16, 0, 0);

      let targetId = connectionId;
      let policy: ConflictPolicy = "EXTERNAL_WINS";

      try {
        const conn = targetId
          ? await prisma.calendarSyncConnection.findFirst({ where: { id: targetId, tenantId } })
          : await prisma.calendarSyncConnection.findFirst({ where: { tenantId } });

        if (conn) {
          targetId = conn.id;
          policy = (conn.conflictPolicy as ConflictPolicy) || "EXTERNAL_WINS";
          const conflictEvent = await prisma.externalCalendarEvent.create({
            data: {
              tenantId,
              connectionId: conn.id,
              externalEventId: `conflict_sim_${Date.now()}`,
              title: `[${
                conn.provider === "GOOGLE_CALENDAR" ? "Google Cal" : "Outlook"
              } Conflict] Emergency Surgery Block (${
                policy === "EXTERNAL_WINS" ? "External Wins → Slot Blocked" : "Internal Wins → Overridden"
              })`,
              startTime: start,
              endTime: end,
              isBusy: true,
              direction: "IMPORTED",
            },
          });

          const resolution = await resolveCalendarConflicts(conn.id, tenantId, policy);
          return NextResponse.json({
            success: true,
            simulatedEvent: conflictEvent,
            resolution,
          });
        }
      } catch (_) {}

      const conns = getFallbackConnections(tenantId);
      const events = getFallbackEvents(tenantId);
      const conn = conns.find((c) => c.id === connectionId) || conns[0];
      policy = (conn.conflictPolicy as ConflictPolicy) || "EXTERNAL_WINS";
      const simEvt = {
        id: `ext-conflict-${Date.now()}`,
        tenantId,
        connectionId: conn.id,
        externalEventId: `conflict_sim_${Date.now()}`,
        title: `[${
          conn.provider === "GOOGLE_CALENDAR" ? "Google Cal" : "Outlook"
        } Conflict] Emergency Surgery Block (${
          policy === "EXTERNAL_WINS" ? "External Wins → Slot Blocked" : "Internal Wins → Overridden"
        })`,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        isBusy: true,
        direction: "IMPORTED" as const,
      };
      events.unshift(simEvt);

      return NextResponse.json({
        success: true,
        simulatedEvent: simEvt,
        resolution: {
          resolvedCount: 1,
          policyApplied: policy,
          resolutions: [
            {
              eventTitle: simEvt.title,
              bookingNumber: "#1004",
              actionTaken:
                policy === "EXTERNAL_WINS"
                  ? "Blocked internal slot & marked conflicting booking for reschedule"
                  : "Retained internal ClientFlow booking over external busy event",
            },
          ],
        },
      });
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Calendar sync operation failed" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  let tenantId = "demo-tenant";
  try {
    const session = await requireTenant();
    tenantId = session.tenantId;
  } catch (_) {}

  try {
    const body = await req.json();
    const {
      connectionId,
      syncDirection,
      conflictPolicy,
      status,
    }: {
      connectionId: string;
      syncDirection?: SyncDirection;
      conflictPolicy?: ConflictPolicy;
      status?: string;
    } = body;

    if (!connectionId) {
      return NextResponse.json({ error: "connectionId is required" }, { status: 400 });
    }

    try {
      const existing = await prisma.calendarSyncConnection.findFirst({
        where: { id: connectionId, tenantId },
      });
      if (existing) {
        const updated = await prisma.calendarSyncConnection.update({
          where: { id: connectionId },
          data: {
            ...(syncDirection !== undefined && { syncDirection }),
            ...(conflictPolicy !== undefined && { conflictPolicy }),
            ...(status !== undefined && { status }),
          },
        });
        return NextResponse.json({ success: true, connection: updated });
      }
    } catch (_) {}

    const conns = getFallbackConnections(tenantId);
    const target = conns.find((c) => c.id === connectionId);
    if (target) {
      if (syncDirection !== undefined) target.syncDirection = syncDirection;
      if (conflictPolicy !== undefined) target.conflictPolicy = conflictPolicy;
      if (status !== undefined) target.status = status;
      return NextResponse.json({ success: true, connection: target });
    }

    return NextResponse.json({ error: "Connection not found" }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update connection" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  let tenantId = "demo-tenant";
  try {
    const session = await requireTenant();
    tenantId = session.tenantId;
  } catch (_) {}

  try {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    const provider = searchParams.get("provider");

    try {
      if (connectionId) {
        await prisma.calendarSyncConnection.deleteMany({
          where: { id: connectionId, tenantId },
        });
      } else if (provider) {
        await prisma.calendarSyncConnection.deleteMany({
          where: { provider, tenantId },
        });
      }
    } catch (_) {}

    const conns = getFallbackConnections(tenantId);
    const idx = conns.findIndex(
      (c) => (connectionId && c.id === connectionId) || (provider && c.provider === provider)
    );
    if (idx !== -1) {
      conns.splice(idx, 1);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to disconnect calendar" },
      { status: 500 }
    );
  }
}
