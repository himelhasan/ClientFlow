import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await requireTenant();

    const business = await prisma.business.findUnique({
      where: { id: session.tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        description: true,
        phone: true,
        whatsapp: true,
        email: true,
        address: true,
        city: true,
        website: true,
        timezone: true,
        currency: true,
        activeModules: true,
        subscriptionPlan: true,
        leadQuota: true,
        leadsUsed: true,
        whatsappQuota: true,
        whatsappUsed: true,
        smsQuota: true,
        smsUsed: true,
        emailQuota: true,
        emailUsed: true,
        status: true,
      },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    return NextResponse.json({ business });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "NO_TENANT_FOUND") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || "Failed to load settings" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireTenant();
    const body = await req.json();

    // Strip read-only / immutable fields from the incoming payload
    const {
      slug: _slug,
      subscriptionPlan: _plan,
      id: _id,
      leadQuota: _lq,
      leadsUsed: _lu,
      whatsappQuota: _waq,
      whatsappUsed: _wau,
      smsQuota: _smq,
      smsUsed: _smu,
      emailQuota: _emq,
      emailUsed: _emu,
      status: _status,
      ...rest
    } = body;

    // Build a safe update payload — only include fields that are present
    const allowedFields = [
      "name",
      "category",
      "description",
      "phone",
      "whatsapp",
      "email",
      "address",
      "city",
      "website",
      "timezone",
      "currency",
      "activeModules",
    ] as const;

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in rest && rest[field] !== undefined) {
        updateData[field] = rest[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });
    }

    const updated = await prisma.business.update({
      where: { id: session.tenantId },
      data: updateData,
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        description: true,
        phone: true,
        whatsapp: true,
        email: true,
        address: true,
        city: true,
        website: true,
        timezone: true,
        currency: true,
        activeModules: true,
        subscriptionPlan: true,
        leadQuota: true,
        leadsUsed: true,
        whatsappQuota: true,
        whatsappUsed: true,
        smsQuota: true,
        smsUsed: true,
        emailQuota: true,
        emailUsed: true,
        status: true,
      },
    });

    return NextResponse.json({ success: true, business: updated });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "NO_TENANT_FOUND") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || "Failed to update settings" }, { status: 500 });
  }
}
