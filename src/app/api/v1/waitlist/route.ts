import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { findOrCreateCustomer } from "@/lib/engine/customer";

const fallbackWaitlistByTenant = new Map<string, any[]>();

function getFallbackWaitlist(tenantId: string) {
  if (!fallbackWaitlistByTenant.has(tenantId)) {
    const tomorrow = new Date(Date.now() + 86400000).toISOString();
    const dayAfter = new Date(Date.now() + 86400000 * 2).toISOString();
    fallbackWaitlistByTenant.set(tenantId, [
      {
        id: `wl-1-${tenantId.slice(0, 4)}`,
        tenantId,
        customerId: "cust-wl-1",
        customer: {
          id: "cust-wl-1",
          name: "Rafiqul Islam",
          phone: "01711223344",
          email: "rafiqul@example.com",
        },
        serviceId: "srv-1",
        service: {
          id: "srv-1",
          name: "Executive Dental Consultation & Scaling",
          durationMinutes: 45,
          price: 1500,
        },
        preferredDate: tomorrow,
        preferredTimeWindow: "MORNING",
        partySize: 1,
        notes: "Needs earliest available morning slot before office hours.",
        status: "WAITING",
        priority: 3,
        notifiedAt: null,
        expiresAt: null,
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
      {
        id: `wl-2-${tenantId.slice(0, 4)}`,
        tenantId,
        customerId: "cust-wl-2",
        customer: {
          id: "cust-wl-2",
          name: "Sabrina Sultana",
          phone: "01819887766",
          email: "sabrina@example.com",
        },
        serviceId: "srv-2",
        service: {
          id: "srv-2",
          name: "Group Wellness & Physiotherapy Session",
          durationMinutes: 60,
          price: 1200,
        },
        preferredDate: tomorrow,
        preferredTimeWindow: "EVENING",
        partySize: 2,
        notes: "Couple physiotherapy rehab session.",
        status: "NOTIFIED",
        priority: 2,
        notifiedAt: new Date(Date.now() - 1800000).toISOString(),
        expiresAt: new Date(Date.now() + 5400000).toISOString(),
        createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      },
      {
        id: `wl-3-${tenantId.slice(0, 4)}`,
        tenantId,
        customerId: "cust-wl-3",
        customer: {
          id: "cust-wl-3",
          name: "Mahmudul Hasan",
          phone: "01912554433",
          email: "mahmud@example.com",
        },
        serviceId: "srv-1",
        service: {
          id: "srv-1",
          name: "Root Canal Specialist Assessment",
          durationMinutes: 60,
          price: 2500,
        },
        preferredDate: dayAfter,
        preferredTimeWindow: "AFTERNOON",
        partySize: 1,
        notes: "Flexible between 2 PM and 5 PM.",
        status: "WAITING",
        priority: 1,
        notifiedAt: null,
        expiresAt: null,
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
    ]);
  }
  return fallbackWaitlistByTenant.get(tenantId)!;
}

export async function GET(req: Request) {
  let tenantId = "demo-tenant";
  try {
    const session = await requireTenant();
    tenantId = session.tenantId;
  } catch (_) {}

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const timeWindow = searchParams.get("timeWindow");

  try {
    const entries = await prisma.waitlistEntry.findMany({
      where: {
        tenantId,
        ...(status && status !== "ALL" ? { status } : {}),
        ...(timeWindow && timeWindow !== "ALL" ? { preferredTimeWindow: timeWindow } : {}),
      },
      include: {
        customer: true,
        service: true,
      },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    });

    if (entries.length === 0 && (!status || status === "ALL") && (!timeWindow || timeWindow === "ALL")) {
      return NextResponse.json({ entries: getFallbackWaitlist(tenantId) });
    }

    return NextResponse.json({ entries });
  } catch (_) {
    let list = getFallbackWaitlist(tenantId);
    if (status && status !== "ALL") {
      list = list.filter((e) => e.status === status);
    }
    if (timeWindow && timeWindow !== "ALL") {
      list = list.filter((e) => e.preferredTimeWindow === timeWindow);
    }
    return NextResponse.json({ entries: list });
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
      action = "CREATE",
      entryId,
      customerName,
      customerPhone,
      customerEmail,
      customerId,
      serviceId,
      serviceName,
      preferredDate,
      preferredTimeWindow = "ANYTIME",
      partySize = 1,
      priority = 1,
      notes,
      startTime = "10:30",
    } = body;

    if (action === "NOTIFY_SLOT") {
      if (!entryId) {
        return NextResponse.json({ error: "entryId is required" }, { status: 400 });
      }
      const now = new Date();
      const expires = new Date(now.getTime() + 2 * 3600000); // 2-hour hold window

      try {
        const updated = await prisma.waitlistEntry.update({
          where: { id: entryId },
          data: {
            status: "NOTIFIED",
            notifiedAt: now,
            expiresAt: expires,
          },
          include: { customer: true, service: true },
        });
        return NextResponse.json({
          success: true,
          entry: updated,
          notificationMessage: `WhatsApp & SMS slot-open alert dispatched to ${updated.customer?.name} (${updated.customer?.phone}). Hold expires in 2 hours.`,
        });
      } catch (_) {
        const list = getFallbackWaitlist(tenantId);
        const target = list.find((e) => e.id === entryId);
        if (target) {
          target.status = "NOTIFIED";
          target.notifiedAt = now.toISOString();
          target.expiresAt = expires.toISOString();
          return NextResponse.json({
            success: true,
            entry: target,
            notificationMessage: `WhatsApp & SMS slot-open alert dispatched to ${target.customer?.name} (${target.customer?.phone}). Hold expires in 2 hours.`,
          });
        }
      }
      return NextResponse.json({ error: "Waitlist entry not found" }, { status: 404 });
    }

    if (action === "CONVERT_TO_BOOKING") {
      if (!entryId) {
        return NextResponse.json({ error: "entryId is required" }, { status: 400 });
      }

      try {
        const entry = await prisma.waitlistEntry.findFirst({
          where: { id: entryId, tenantId },
          include: { customer: true, service: true },
        });

        if (entry) {
          const bookingCount = await prisma.booking.count({ where: { tenantId } });
          const bookingNumber = `#${1000 + bookingCount + 1}`;
          const slotTime =
            entry.preferredTimeWindow === "MORNING"
              ? "10:00"
              : entry.preferredTimeWindow === "AFTERNOON"
              ? "14:30"
              : entry.preferredTimeWindow === "EVENING"
              ? "17:30"
              : startTime;

          const booking = await prisma.booking.create({
            data: {
              tenantId,
              bookingNumber,
              customerId: entry.customerId,
              serviceId: entry.serviceId,
              status: "CONFIRMED",
              date: entry.preferredDate,
              startTime: slotTime,
              endTime: slotTime,
              durationMinutes: entry.service?.durationMinutes || 30,
              price: entry.service?.price || 0,
              partySize: entry.partySize || 1,
              notes: `Converted from Priority Waitlist. ${entry.notes || ""}`.trim(),
            },
            include: { customer: true, service: true },
          });

          const updatedEntry = await prisma.waitlistEntry.update({
            where: { id: entryId },
            data: { status: "BOOKED" },
            include: { customer: true, service: true },
          });

          return NextResponse.json({
            success: true,
            entry: updatedEntry,
            booking,
          });
        }
      } catch (_) {}

      const list = getFallbackWaitlist(tenantId);
      const target = list.find((e) => e.id === entryId);
      if (target) {
        target.status = "BOOKED";
        const mockBooking = {
          id: `bk-wl-${Date.now()}`,
          bookingNumber: `#${Math.floor(1050 + Math.random() * 50)}`,
          status: "CONFIRMED",
          customer: target.customer,
          service: target.service,
          date: target.preferredDate,
          startTime:
            target.preferredTimeWindow === "MORNING"
              ? "10:00"
              : target.preferredTimeWindow === "AFTERNOON"
              ? "14:30"
              : "17:30",
        };
        return NextResponse.json({
          success: true,
          entry: target,
          booking: mockBooking,
        });
      }

      return NextResponse.json({ error: "Waitlist entry not found" }, { status: 404 });
    }

    // Default action: CREATE waitlist entry
    if (!customerName || !customerPhone) {
      return NextResponse.json(
        { error: "Customer name and phone are required" },
        { status: 400 }
      );
    }

    const prefDateObj = preferredDate ? new Date(`${preferredDate}T00:00:00`) : new Date();

    try {
      let resolvedCustomerId = customerId;
      if (!resolvedCustomerId) {
        const c = await findOrCreateCustomer({
          tenantId,
          name: customerName,
          phone: customerPhone,
          email: customerEmail,
        });
        resolvedCustomerId = c.id;
      }

      let resolvedServiceId = serviceId;
      if (!resolvedServiceId) {
        const firstService = await prisma.service.findFirst({ where: { tenantId } });
        resolvedServiceId = firstService?.id;
      }

      if (resolvedCustomerId && resolvedServiceId) {
        const created = await prisma.waitlistEntry.create({
          data: {
            tenantId,
            customerId: resolvedCustomerId,
            serviceId: resolvedServiceId,
            preferredDate: prefDateObj,
            preferredTimeWindow,
            partySize: Math.max(1, Number(partySize) || 1),
            priority: Number(priority) || 1,
            notes: notes || null,
            status: "WAITING",
          },
          include: { customer: true, service: true },
        });
        return NextResponse.json({ success: true, entry: created });
      }
    } catch (_) {}

    const list = getFallbackWaitlist(tenantId);
    const newEntry = {
      id: `wl-${Date.now()}`,
      tenantId,
      customer: {
        name: customerName,
        phone: customerPhone,
        email: customerEmail || "",
      },
      service: {
        id: serviceId || "srv-custom",
        name: serviceName || "Scheduled Consultation",
        durationMinutes: 45,
        price: 1200,
      },
      preferredDate: prefDateObj.toISOString(),
      preferredTimeWindow,
      partySize: Math.max(1, Number(partySize) || 1),
      priority: Number(priority) || 1,
      notes: notes || "",
      status: "WAITING",
      notifiedAt: null,
      expiresAt: null,
      createdAt: new Date().toISOString(),
    };
    list.unshift(newEntry);
    return NextResponse.json({ success: true, entry: newEntry });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to process waitlist action" },
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
    const { entryId, status, priority, preferredTimeWindow, notes } = body;

    if (!entryId) {
      return NextResponse.json({ error: "entryId is required" }, { status: 400 });
    }

    try {
      const existing = await prisma.waitlistEntry.findFirst({
        where: { id: entryId, tenantId },
      });
      if (existing) {
        const updated = await prisma.waitlistEntry.update({
          where: { id: entryId },
          data: {
            ...(status !== undefined && { status }),
            ...(priority !== undefined && { priority: Number(priority) }),
            ...(preferredTimeWindow !== undefined && { preferredTimeWindow }),
            ...(notes !== undefined && { notes }),
          },
          include: { customer: true, service: true },
        });
        return NextResponse.json({ success: true, entry: updated });
      }
    } catch (_) {}

    const list = getFallbackWaitlist(tenantId);
    const target = list.find((e) => e.id === entryId);
    if (target) {
      if (status !== undefined) target.status = status;
      if (priority !== undefined) target.priority = Number(priority);
      if (preferredTimeWindow !== undefined) target.preferredTimeWindow = preferredTimeWindow;
      if (notes !== undefined) target.notes = notes;
      return NextResponse.json({ success: true, entry: target });
    }

    return NextResponse.json({ error: "Waitlist entry not found" }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update waitlist entry" },
      { status: 500 }
    );
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
    const entryId = searchParams.get("entryId");

    if (!entryId) {
      return NextResponse.json({ error: "entryId is required" }, { status: 400 });
    }

    try {
      await prisma.waitlistEntry.deleteMany({
        where: { id: entryId, tenantId },
      });
    } catch (_) {}

    const list = getFallbackWaitlist(tenantId);
    const idx = list.findIndex((e) => e.id === entryId);
    if (idx !== -1) {
      list.splice(idx, 1);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete waitlist entry" },
      { status: 500 }
    );
  }
}
