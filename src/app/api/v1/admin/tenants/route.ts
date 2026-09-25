import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const PLAN_PRESETS: Record<
  string,
  { price: number; leads: number; wa: number; sms: number; email: number }
> = {
  Starter: { price: 500, leads: 50, wa: 150, sms: 100, email: 150 },
  Growth: { price: 1500, leads: 250, wa: 750, sms: 500, email: 750 },
  Pro: { price: 3500, leads: 1000, wa: 3000, sms: 2000, email: 3000 },
  Enterprise: { price: 7500, leads: 5000, wa: 15000, sms: 10000, email: 15000 },
};

export async function GET() {
  try {
    await requireAuth();

    const businesses = await prisma.business.findMany({
      include: {
        _count: {
          select: {
            bookings: true,
            leads: true,
            customers: true,
            forms: true,
            staff: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalMRR = businesses.reduce((sum, b) => {
      if (b.status !== "ACTIVE") return sum;
      const plan = PLAN_PRESETS[b.subscriptionPlan || "Starter"] || PLAN_PRESETS.Starter;
      return sum + plan.price;
    }, 0);

    return NextResponse.json({
      businesses,
      platformStats: {
        totalTenants: businesses.length,
        activeTenants: businesses.filter((b) => b.status === "ACTIVE").length,
        totalMRR,
        totalBookings: businesses.reduce((s, b) => s + b._count.bookings, 0),
        totalLeads: businesses.reduce((s, b) => s + b._count.leads, 0),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load platform tenants" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const {
      tenantId,
      subscriptionPlan,
      status,
      leadQuota,
      whatsappQuota,
      smsQuota,
      emailQuota,
      resetUsage,
    } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    const preset = subscriptionPlan ? PLAN_PRESETS[subscriptionPlan] : null;

    const updated = await prisma.business.update({
      where: { id: tenantId },
      data: {
        ...(subscriptionPlan ? { subscriptionPlan } : {}),
        ...(status ? { status } : {}),
        ...(preset
          ? {
              leadQuota: preset.leads,
              whatsappQuota: preset.wa,
              smsQuota: preset.sms,
              emailQuota: preset.email,
            }
          : {}),
        ...(leadQuota !== undefined ? { leadQuota: Number(leadQuota) } : {}),
        ...(whatsappQuota !== undefined
          ? { whatsappQuota: Number(whatsappQuota) }
          : {}),
        ...(smsQuota !== undefined ? { smsQuota: Number(smsQuota) } : {}),
        ...(emailQuota !== undefined ? { emailQuota: Number(emailQuota) } : {}),
        ...(resetUsage
          ? {
              leadsUsed: 0,
              whatsappUsed: 0,
              smsUsed: 0,
              emailUsed: 0,
            }
          : {}),
      },
    });

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: session.userId,
        action: "SUPER_ADMIN_UPDATE",
        entity: "Business",
        entityId: tenantId,
        newData: body,
      },
    });

    return NextResponse.json({ success: true, business: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update tenant" },
      { status: 500 }
    );
  }
}
