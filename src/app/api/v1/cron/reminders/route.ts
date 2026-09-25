import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { whatsAppService, smsService } from "@/lib/messaging/adapters";
import { formatBdDate } from "@/lib/utils/bangladesh";

export async function POST() {
  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);

    // Find all upcoming CONFIRMED bookings in the next 48 hours
    const upcomingBookings = await prisma.booking.findMany({
      where: {
        status: "CONFIRMED",
        date: {
          gte: new Date(now.toISOString().split("T")[0]),
          lte: new Date(tomorrow.toISOString().split("T")[0] + "T23:59:59"),
        },
      },
      include: {
        customer: true,
        service: true,
        tenant: true,
      },
    });

    let dispatchedCount = 0;
    let skippedIdempotent = 0;

    for (const booking of upcomingBookings) {
      const idempotencyKey = `reminder_24h_${booking.id}`;

      // Check if reminder was already sent using Message.idempotencyKey
      const alreadySent = await prisma.message.findUnique({
        where: { idempotencyKey },
      });

      if (alreadySent) {
        skippedIdempotent++;
        continue;
      }

      const content = `Reminder from ${booking.tenant.name}: Your appointment for ${booking.service?.name} is scheduled for ${formatBdDate(booking.date)} at ${booking.startTime} (ID: ${booking.bookingNumber}).`;

      const recipient = booking.customer.whatsapp || booking.customer.phone;

      // Send via WhatsApp adapter (falls back to SMS)
      const sendRes = await whatsAppService.send({
        tenantId: booking.tenantId,
        leadId: booking.leadId || undefined,
        bookingId: booking.id,
        to: recipient,
        content,
      });

      if (!sendRes.success) {
        await smsService.send({
          tenantId: booking.tenantId,
          leadId: booking.leadId || undefined,
          bookingId: booking.id,
          to: booking.customer.phone,
          content,
        });
      }

      // Record idempotent Message entry so it is never sent twice
      await prisma.message.create({
        data: {
          tenantId: booking.tenantId,
          bookingId: booking.id,
          leadId: booking.leadId,
          direction: "OUTBOUND",
          channel: sendRes.success ? "WHATSAPP" : "SMS",
          messageType: "TRANSACTIONAL",
          content,
          status: "SENT",
          idempotencyKey,
          sentAt: new Date(),
        },
      });

      dispatchedCount++;
    }

    return NextResponse.json({
      success: true,
      scannedBookings: upcomingBookings.length,
      dispatchedCount,
      skippedIdempotent,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to execute reminder cron" },
      { status: 500 }
    );
  }
}
