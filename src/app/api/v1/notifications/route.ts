import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await requireTenant();
    const tenantId = session.tenantId;

    const [notifications, unreadCount, auditLogs, usageLedger] =
      await Promise.all([
        prisma.notification.findMany({
          where: { tenantId },
          orderBy: { createdAt: "desc" },
          take: 40,
        }),
        prisma.notification.count({
          where: { tenantId, isRead: false },
        }),
        prisma.auditLog.findMany({
          where: { tenantId },
          include: {
            user: { select: { name: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 25,
        }),
        prisma.usageRecord.findMany({
          where: { tenantId },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),
      ]);

    return NextResponse.json({
      notifications,
      unreadCount,
      auditLogs,
      usageLedger,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load notifications" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireTenant();
    const tenantId = session.tenantId;
    const body = await req.json();

    if (body.markAllRead) {
      await prisma.notification.updateMany({
        where: { tenantId, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true });
    }

    if (body.notificationId) {
      await prisma.notification.updateMany({
        where: { id: body.notificationId, tenantId },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "notificationId or markAllRead is required" },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update notification" },
      { status: 500 }
    );
  }
}
