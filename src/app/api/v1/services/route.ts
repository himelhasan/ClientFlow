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
    const { name, description, durationMinutes, price, pricingModel, category } = body;

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
        category,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, service });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create service" }, { status: 500 });
  }
}
