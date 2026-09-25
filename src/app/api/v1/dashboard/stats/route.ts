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

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    const [
      business,
      todayBookingsCount,
      totalBookingsCount,
      pendingBookingsCount,
      totalLeadsCount,
      newLeadsCount,
      revenueResult,
      thisMonthRevenueResult,
      lastMonthRevenueResult,
      latestBooking,
      upcomingBookings,
      calendarBookings,
      recentLeads,
      services,
      staff,
      unreadNotificationsCount,
    ] = await Promise.all([
      prisma.business.findUnique({
        where: { id: tenantId },
        select: {
          name: true,
          category: true,
          city: true,
          currency: true,
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
        where: {
          tenantId,
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
        where: { tenantId, status: { in: ["COMPLETED", "CONFIRMED"] } },
        _sum: { price: true },
      }),
      prisma.booking.aggregate({
        where: {
          tenantId,
          date: { gte: startOfMonth },
          status: { in: ["COMPLETED", "CONFIRMED"] },
        },
        _sum: { price: true },
      }),
      prisma.booking.aggregate({
        where: {
          tenantId,
          date: { gte: startOfLastMonth, lt: startOfMonth },
          status: { in: ["COMPLETED", "CONFIRMED"] },
        },
        _sum: { price: true },
      }),
      prisma.booking.findFirst({
        where: {
          tenantId,
          status: { notIn: ["CANCELLED", "REJECTED"] },
        },
        orderBy: [{ date: "desc" }, { startTime: "desc" }],
        select: {
          id: true,
          date: true,
          startTime: true,
          customer: { select: { name: true } },
          service: { select: { name: true } },
        },
      }),
      prisma.booking.findMany({
        where: {
          tenantId,
          date: { gte: today },
          status: { notIn: ["CANCELLED", "REJECTED"] },
        },
        include: {
          customer: { select: { name: true, phone: true, email: true } },
          service: { select: { name: true, category: true, durationMinutes: true } },
          staff: { select: { name: true, role: true } },
        },
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
        take: 10,
      }),
      prisma.booking.findMany({
        where: {
          tenantId,
          status: { notIn: ["REJECTED"] },
        },
        include: {
          customer: { select: { name: true, phone: true, email: true } },
          service: { select: { name: true, category: true, durationMinutes: true } },
          staff: { select: { name: true, role: true } },
        },
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
        take: 200,
      }),
      prisma.lead.findMany({
        where: { tenantId },
        include: {
          customer: { select: { name: true, phone: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.service.findMany({
        where: { tenantId, isActive: true },
        select: { id: true, name: true, durationMinutes: true, price: true, category: true },
        orderBy: { name: "asc" },
      }),
      prisma.staff.findMany({
        where: { tenantId, status: "ACTIVE" },
        select: { id: true, name: true, role: true },
        orderBy: { name: "asc" },
      }),
      prisma.notification.count({
        where: { tenantId, isRead: false },
      }),
    ]);

    const totalRevenue = Number(revenueResult._sum.price || 0);
    const thisMonthRev = Number(thisMonthRevenueResult._sum.price || 0);
    const lastMonthRev = Number(lastMonthRevenueResult._sum.price || 0);

    let revenueDeltaPct = 0;
    if (lastMonthRev > 0) {
      revenueDeltaPct = Math.round(((thisMonthRev - lastMonthRev) / lastMonthRev) * 100);
    } else if (thisMonthRev > 0) {
      revenueDeltaPct = 100;
    }

    const displayRevenue = thisMonthRev > 0 ? thisMonthRev : totalRevenue;

    // Build 6-bucket revenue trend series from real calendarBookings in current month
    const revenueBuckets = [0, 0, 0, 0, 0, 0];
    calendarBookings.forEach((b) => {
      if (b.status === "COMPLETED" || b.status === "CONFIRMED") {
        const bDate = new Date(b.date);
        if (bDate >= startOfMonth) {
          const bucketIdx = Math.min(5, Math.floor((bDate.getDate() - 1) / 5));
          revenueBuckets[bucketIdx] += Number(b.price || 0);
        }
      }
    });

    return NextResponse.json({
      business,
      unreadNotificationsCount,
      metrics: {
        todayBookings: todayBookingsCount,
        totalBookings: totalBookingsCount,
        pendingBookings: pendingBookingsCount,
        totalLeads: totalLeadsCount,
        newLeadsToday: newLeadsCount,
        totalRevenue: formatBDT(displayRevenue),
        thisMonthRevenue: formatBDT(thisMonthRev),
        lastMonthRevenue: formatBDT(lastMonthRev),
        rawRevenue: displayRevenue,
        revenueDeltaPct,
        revenueBuckets,
      },
      quota: {
        leadRemaining: Math.max(0, (business?.leadQuota ?? 50) - (business?.leadsUsed ?? 0)),
        leadQuota: business?.leadQuota ?? 50,
        leadsUsed: business?.leadsUsed ?? 0,
        whatsappUsed: business?.whatsappUsed ?? 0,
        whatsappQuota: business?.whatsappQuota ?? 150,
        smsUsed: business?.smsUsed ?? 0,
        smsQuota: business?.smsQuota ?? 100,
      },
      latestBooking,
      upcomingBookings,
      calendarBookings,
      recentLeads,
      services,
      staff,
    });
  } catch (error: any) {
    const isAuthError = error.message === "UNAUTHORIZED" || error.message === "NO_TENANT_FOUND";
    return NextResponse.json(
      { error: error.message || "Failed to load dashboard statistics" },
      { status: isAuthError ? 401 : 500 }
    );
  }
}
