import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = await requireTenant();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const leads = await prisma.lead.findMany({
      where: {
        tenantId: session.tenantId,
        ...(status ? { status: status as any } : {}),
      },
      include: {
        customer: true,
        bookings: {
          include: { service: true },
        },
        events: {
          orderBy: { createdAt: "desc" },
          take: 3,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ leads });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load leads" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireTenant();
    const { leadId, status, notes } = await req.json();

    if (!leadId || !status) {
      return NextResponse.json({ error: "Lead ID and status are required" }, { status: 400 });
    }

    const lead = await prisma.lead.findFirst({
      where: { id: leadId, tenantId: session.tenantId },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const updated = await prisma.lead.update({
      where: { id: leadId },
      data: {
        status: status as any,
        ...(notes ? { notes } : {}),
      },
    });

    await prisma.leadEvent.create({
      data: {
        tenantId: session.tenantId,
        leadId,
        type: `LEAD_STATUS_${status}`,
        description: `Lead status changed to ${status}`,
      },
    });

    return NextResponse.json({ success: true, lead: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update lead" }, { status: 500 });
  }
}
