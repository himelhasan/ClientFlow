import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatBDT } from "@/lib/utils/bangladesh";

export async function GET() {
  try {
    const session = await requireTenant();
    const tenantId = session.tenantId;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      business,
      todayBookingsCount,
      pendingBookingsCount,
      totalLeadsCount,
      newLeadsCount,
      revenueResult,
      upcomingBookings,
      recentLeads,
    ] = await Promise.all([
      prisma.business.findUnique({
        where: { id: tenantId },
        select: {
          name: true,
          leadQuota: true,
          leadsUsed: true,
          whatsappQuota: true,
          whatsappUsed: true,
          smsQuota: true,
          smsUsed: true,
          emailQuota: true,
          emailUsed: true,
          subscriptionPlan: true,
        },
      }),
      prisma.booking.count({
        where: {
          tenantId,
          date: { gte: today, lt: tomorrow },
          status: { notIn: ["CANCELLED", "REJECTED"] },
        },
      }),
      prisma.booking.count({
        where: { tenantId, status: "PENDING" },
      }),
      prisma.lead.count({ where: { tenantId } }),
      prisma.lead.count({
        where: { tenantId, createdAt: { gte: today } },
      }),
      prisma.booking.aggregate({
        where: { tenantId, status: "COMPLETED" },
        _sum: { price: true },
      }),
      prisma.booking.findMany({
        where: {
          tenantId,
          date: { gte: today },
          status: { notIn: ["CANCELLED", "REJECTED"] },
        },
        include: {
          customer: { select: { name: true, phone: true } },
          service: { select: { name: true, durationMinutes: true } },
        },
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
        take: 5,
      }),
      prisma.lead.findMany({
        where: { tenantId },
        include: {
          customer: { select: { name: true, phone: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    const totalRevenue = revenueResult._sum.price || 0;

    return NextResponse.json({
      business,
      metrics: {
        todayBookings: todayBookingsCount,
        pendingBookings: pendingBookingsCount,
        totalLeads: totalLeadsCount,
        newLeadsToday: newLeadsCount,
        totalRevenue: formatBDT(totalRevenue),
        rawRevenue: totalRevenue,
      },
      quota: {
        leadRemaining: (business?.leadQuota || 50) - (business?.leadsUsed || 0),
        leadQuota: business?.leadQuota || 50,
        leadsUsed: business?.leadsUsed || 0,
        whatsappUsed: business?.whatsappUsed || 0,
        whatsappQuota: business?.whatsappQuota || 150,
        smsUsed: business?.smsUsed || 0,
        smsQuota: business?.smsQuota || 100,
      },
      upcomingBookings,
      recentLeads,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load dashboard statistics" }, { status: 500 });
  }
}
