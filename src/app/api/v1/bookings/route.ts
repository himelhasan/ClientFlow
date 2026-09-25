import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateCustomerMetrics } from "@/lib/engine/customer";

export async function GET(req: Request) {
  try {
    const session = await requireTenant();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const bookings = await prisma.booking.findMany({
      where: {
        tenantId: session.tenantId,
        ...(status ? { status: status as any } : {}),
      },
      include: {
        customer: true,
        service: true,
        staff: true,
      },
      orderBy: [{ date: "desc" }, { startTime: "desc" }],
    });

    return NextResponse.json({ bookings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load bookings" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireTenant();
    const { bookingId, status, notes } = await req.json();

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
        ...(notes ? { notes } : {}),
      },
    });

    // Record booking event
    await prisma.bookingEvent.create({
      data: {
        tenantId: session.tenantId,
        bookingId,
        type: `STATUS_CHANGED_${status}`,
        description: `Booking status changed to ${status}`,
      },
    });

    // Update customer CRM metrics
    await updateCustomerMetrics(booking.customerId);

    return NextResponse.json({ success: true, booking: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update booking status" }, { status: 500 });
  }
}
