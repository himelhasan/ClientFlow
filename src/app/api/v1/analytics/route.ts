import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await requireTenant();
    const tenantId = session.tenantId;

    const now = new Date();
    const last30Start = new Date(now);
    last30Start.setDate(last30Start.getDate() - 30);
    const last7Start = new Date(now);
    last7Start.setDate(last7Start.getDate() - 7);

    // ── Booking Stats ─────────────────────────────────────────────────────────
    const [
      totalBookings,
      completedBookings,
      cancelledBookings,
      noShowBookings,
      pendingBookings,
      confirmedBookings,
      bookings30Total,
      bookings30Completed,
      bookings30Cancelled,
      bookings30NoShow,
      bookings30Pending,
      bookings30Confirmed,
    ] = await Promise.all([
      prisma.booking.count({ where: { tenantId } }),
      prisma.booking.count({ where: { tenantId, status: "COMPLETED" } }),
      prisma.booking.count({ where: { tenantId, status: "CANCELLED" } }),
      prisma.booking.count({ where: { tenantId, status: "NO_SHOW" } }),
      prisma.booking.count({ where: { tenantId, status: "PENDING" } }),
      prisma.booking.count({ where: { tenantId, status: "CONFIRMED" } }),
      prisma.booking.count({ where: { tenantId, createdAt: { gte: last30Start } } }),
      prisma.booking.count({ where: { tenantId, status: "COMPLETED", createdAt: { gte: last30Start } } }),
      prisma.booking.count({ where: { tenantId, status: "CANCELLED", createdAt: { gte: last30Start } } }),
      prisma.booking.count({ where: { tenantId, status: "NO_SHOW", createdAt: { gte: last30Start } } }),
      prisma.booking.count({ where: { tenantId, status: "PENDING", createdAt: { gte: last30Start } } }),
      prisma.booking.count({ where: { tenantId, status: "CONFIRMED", createdAt: { gte: last30Start } } }),
    ]);

    const bookingStats = {
      allTime: {
        total: totalBookings,
        completed: completedBookings,
        cancelled: cancelledBookings,
        noShow: noShowBookings,
        pending: pendingBookings,
        confirmed: confirmedBookings,
      },
      last30days: {
        total: bookings30Total,
        completed: bookings30Completed,
        cancelled: bookings30Cancelled,
        noShow: bookings30NoShow,
        pending: bookings30Pending,
        confirmed: bookings30Confirmed,
      },
    };

    // ── Lead Stats ────────────────────────────────────────────────────────────
    const [totalLeads, leadsByStatus, leadsBySource] = await Promise.all([
      prisma.lead.count({ where: { tenantId } }),
      prisma.lead.groupBy({
        by: ["status"],
        where: { tenantId },
        _count: { id: true },
      }),
      prisma.lead.groupBy({
        by: ["source"],
        where: { tenantId },
        _count: { id: true },
      }),
    ]);

    const leadStats = {
      total: totalLeads,
      byStatus: Object.fromEntries(leadsByStatus.map((r) => [r.status, r._count.id])),
      bySource: Object.fromEntries(leadsBySource.map((r) => [r.source, r._count.id])),
    };

    // ── Form Stats ────────────────────────────────────────────────────────────
    const forms = await prisma.form.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        viewCount: true,
        startCount: true,
        submitCount: true,
      },
      orderBy: { submitCount: "desc" },
    });

    const formStats = forms.map((f) => ({
      formId: f.id,
      name: f.name,
      slug: f.slug,
      viewCount: f.viewCount,
      startCount: f.startCount,
      submitCount: f.submitCount,
      conversionRate:
        f.viewCount > 0 ? parseFloat(((f.submitCount / f.viewCount) * 100).toFixed(1)) : 0,
    }));

    // ── Revenue Stats ─────────────────────────────────────────────────────────
    const [revAllTime, rev30, rev7] = await Promise.all([
      prisma.booking.aggregate({
        where: { tenantId, status: "COMPLETED" },
        _sum: { price: true },
      }),
      prisma.booking.aggregate({
        where: { tenantId, status: "COMPLETED", createdAt: { gte: last30Start } },
        _sum: { price: true },
      }),
      prisma.booking.aggregate({
        where: { tenantId, status: "COMPLETED", createdAt: { gte: last7Start } },
        _sum: { price: true },
      }),
    ]);

    const revenueStats = {
      total: Number(revAllTime._sum.price ?? 0),
      last30days: Number(rev30._sum.price ?? 0),
      last7days: Number(rev7._sum.price ?? 0),
    };

    // ── Top Services ──────────────────────────────────────────────────────────
    const topServicesRaw = await prisma.booking.groupBy({
      by: ["serviceId"],
      where: { tenantId },
      _count: { id: true },
      _sum: { price: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    });

    const serviceIds = topServicesRaw.map((r) => r.serviceId);
    const serviceRecords = await prisma.service.findMany({
      where: { id: { in: serviceIds } },
      select: { id: true, name: true },
    });
    const serviceMap = Object.fromEntries(serviceRecords.map((s) => [s.id, s.name]));

    const topServices = topServicesRaw.map((r) => ({
      serviceId: r.serviceId,
      name: serviceMap[r.serviceId] ?? "Unknown",
      bookingCount: r._count.id,
      revenue: Number(r._sum.price ?? 0),
    }));

    return NextResponse.json({
      bookingStats,
      leadStats,
      formStats,
      revenueStats,
      topServices,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "NO_TENANT_FOUND") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || "Failed to load analytics" }, { status: 500 });
  }
}
