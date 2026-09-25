import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateCustomerMetrics } from "@/lib/engine/customer";
import { findOrCreateCustomer } from "@/lib/engine/customer";
import { normalizeBdPhone } from "@/lib/utils/bangladesh";

export async function GET(req: Request) {
  try {
    const session = await requireTenant();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const upcoming = searchParams.get("upcoming");
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const limit = Math.min(100, Number(searchParams.get("limit") || "20"));

    const where: any = {
      tenantId: session.tenantId,
      ...(status ? { status: status as any } : {}),
      ...(upcoming === "true"
        ? { date: { gte: new Date() }, status: { notIn: ["CANCELLED", "REJECTED", "COMPLETED"] } }
        : {}),
    };

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: { customer: true, service: true, staff: true, branch: true },
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);

    return NextResponse.json({ bookings, total, page, pages: Math.ceil(total / limit) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load bookings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireTenant();
    const body = await req.json();

    const {
      serviceId,
      staffId,
      branchId,
      date,
      startTime,
      endTime,
      notes,
      // Customer can be provided by ID or by phone+name (creates/matches)
      customerId,
      customerName,
      customerPhone,
      customerEmail,
    } = body;

    if (!serviceId || !date || !startTime) {
      return NextResponse.json(
        { error: "serviceId, date, and startTime are required" },
        { status: 400 }
      );
    }

    const tenantId = session.tenantId;

    // Resolve service
    const service = await prisma.service.findFirst({
      where: { id: serviceId, tenantId, isActive: true },
    });
    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Resolve customer
    let resolvedCustomerId = customerId;
    if (!resolvedCustomerId) {
      if (!customerPhone || !customerName) {
        return NextResponse.json(
          { error: "Either customerId or customerName + customerPhone is required" },
          { status: 400 }
        );
      }
      const customer = await findOrCreateCustomer({
        tenantId,
        name: customerName,
        phone: customerPhone,
        email: customerEmail,
      });
      resolvedCustomerId = customer.id;
    } else {
      const existing = await prisma.customer.findFirst({
        where: { id: resolvedCustomerId, tenantId },
      });
      if (!existing) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
      }
    }

    // Generate booking number
    const bookingCount = await prisma.booking.count({ where: { tenantId } });
    const bookingNumber = `#${1000 + bookingCount + 1}`;

    const appointmentDate = new Date(`${date}T00:00:00`);

    const booking = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.create({
        data: {
          tenantId,
          bookingNumber,
          customerId: resolvedCustomerId,
          serviceId,
          ...(staffId ? { staffId } : {}),
          ...(branchId ? { branchId } : {}),
          status: "PENDING",
          date: appointmentDate,
          startTime,
          endTime: endTime || startTime,
          durationMinutes: service.durationMinutes,
          price: service.price,
          notes: notes || null,
        },
        include: { customer: true, service: true, staff: true },
      });

      await tx.bookingEvent.create({
        data: {
          tenantId,
          bookingId: b.id,
          type: "CREATED",
          description: "Booking created manually from dashboard",
        },
      });

      await tx.notification.create({
        data: {
          tenantId,
          type: "NEW_BOOKING",
          title: `New Booking: ${b.customer.name}`,
          message: `${b.customer.name} booked ${service.name} for ${date} at ${startTime}.`,
          link: `/dashboard/bookings`,
        },
      });

      return b;
    });

    return NextResponse.json({ success: true, booking });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create booking" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireTenant();
    const { bookingId, status, notes, staffId, date, startTime, endTime } = await req.json();

    if (!bookingId || !status) {
      return NextResponse.json({ error: "Booking ID and new status are required" }, { status: 400 });
    }

    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, tenantId: session.tenantId },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: status as any,
        ...(notes !== undefined && { notes }),
        ...(staffId !== undefined && { staffId }),
        ...(date !== undefined && { date: new Date(`${date}T00:00:00`) }),
        ...(startTime !== undefined && { startTime }),
        ...(endTime !== undefined && { endTime }),
      },
      include: { customer: true, service: true, staff: true },
    });

    await prisma.bookingEvent.create({
      data: {
        tenantId: session.tenantId,
        bookingId,
        type: `STATUS_CHANGED_${status}`,
        description: `Booking status changed to ${status}`,
      },
    });

    // Update customer CRM metrics when booking is resolved
    if (["COMPLETED", "CANCELLED", "NO_SHOW"].includes(status)) {
      await updateCustomerMetrics(booking.customerId);
    }

    return NextResponse.json({ success: true, booking: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update booking" }, { status: 500 });
  }
}
