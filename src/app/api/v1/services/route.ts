import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await requireTenant();
    const services = await prisma.service.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ services });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load services" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireTenant();
    const body = await req.json();
    const { name, description, durationMinutes, price, pricingModel, category, bufferTimeMinutes } = body;

    if (!name) {
      return NextResponse.json({ error: "Service name is required" }, { status: 400 });
    }

    const service = await prisma.service.create({
      data: {
        tenantId: session.tenantId,
        name,
        description,
        durationMinutes: Number(durationMinutes) || 30,
        price: Number(price) || 0,
        pricingModel: pricingModel || "FIXED",
        bufferTimeMinutes: Number(bufferTimeMinutes) || 0,
        category,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, service });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create service" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireTenant();
    const body = await req.json();
    const { serviceId, name, description, durationMinutes, price, pricingModel, category, bufferTimeMinutes, isActive } = body;

    if (!serviceId) {
      return NextResponse.json({ error: "serviceId is required" }, { status: 400 });
    }

    const existing = await prisma.service.findFirst({
      where: { id: serviceId, tenantId: session.tenantId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const updated = await prisma.service.update({
      where: { id: serviceId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(durationMinutes !== undefined && { durationMinutes: Number(durationMinutes) }),
        ...(price !== undefined && { price: Number(price) }),
        ...(pricingModel !== undefined && { pricingModel }),
        ...(category !== undefined && { category }),
        ...(bufferTimeMinutes !== undefined && { bufferTimeMinutes: Number(bufferTimeMinutes) }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ success: true, service: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update service" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await requireTenant();
    const { searchParams } = new URL(req.url);
    const serviceId = searchParams.get("serviceId");

    if (!serviceId) {
      return NextResponse.json({ error: "serviceId is required" }, { status: 400 });
    }

    const existing = await prisma.service.findFirst({
      where: { id: serviceId, tenantId: session.tenantId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Soft-delete: mark inactive rather than hard delete (bookings may reference it)
    await prisma.service.update({
      where: { id: serviceId },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete service" }, { status: 500 });
  }
}

