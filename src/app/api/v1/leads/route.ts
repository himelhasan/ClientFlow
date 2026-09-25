import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { findOrCreateCustomer } from "@/lib/engine/customer";

export async function GET(req: Request) {
  try {
    const session = await requireTenant();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const source = searchParams.get("source");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const leads = await prisma.lead.findMany({
      where: {
        tenantId: session.tenantId,
        ...(status ? { status: status as any } : {}),
        ...(source ? { source: source as any } : {}),
      },
      include: {
        customer: true,
        form: {
          select: { name: true },
        },
        bookings: {
          include: { service: true },
        },
        events: {
          orderBy: { createdAt: "desc" },
          take: 3,
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ leads });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "NO_TENANT_FOUND") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error.message || "Failed to load leads" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireTenant();
    const { customerName, customerPhone, source, title, notes } = await req.json();

    if (!customerName || !customerPhone) {
      return NextResponse.json(
        { error: "Customer name and phone are required" },
        { status: 400 }
      );
    }

    // Find or create the customer profile
    const customer = await findOrCreateCustomer({
      tenantId: session.tenantId,
      name: customerName,
      phone: customerPhone,
    });

    // Create the lead record
    const lead = await prisma.lead.create({
      data: {
        tenantId: session.tenantId,
        customerId: customer.id,
        source: (source as any) || "MANUAL",
        title: title || null,
        notes: notes || null,
        status: "NEW",
      },
      include: {
        customer: true,
        form: { select: { name: true } },
        bookings: { include: { service: true } },
        events: { orderBy: { createdAt: "desc" }, take: 3 },
      },
    });

    // Record the creation event
    await prisma.leadEvent.create({
      data: {
        tenantId: session.tenantId,
        leadId: lead.id,
        type: "LEAD_CREATED",
        description: `Lead created manually for ${customer.name}`,
      },
    });

    return NextResponse.json({ lead }, { status: 201 });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "NO_TENANT_FOUND") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error.message || "Failed to create lead" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireTenant();
    const { leadId, status, notes } = await req.json();

    if (!leadId || !status) {
      return NextResponse.json(
        { error: "Lead ID and status are required" },
        { status: 400 }
      );
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
        ...(notes !== undefined ? { notes } : {}),
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
    if (error.message === "UNAUTHORIZED" || error.message === "NO_TENANT_FOUND") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error.message || "Failed to update lead" },
      { status: 500 }
    );
  }
}
