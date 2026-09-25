import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";

// In-memory store for extended service fields if DB columns aren't migrated or DB is offline
const serviceMetaStore = new Map<
  string,
  {
    maxCapacity: number;
    allowGroupBooking: boolean;
    depositType: string;
    depositValue: number;
    cancellationFee: number;
    cancellationWindowHours: number;
  }
>();

const fallbackServicesByTenant = new Map<string, any[]>();

function getFallbackServices(tenantId: string) {
  if (!fallbackServicesByTenant.has(tenantId)) {
    fallbackServicesByTenant.set(tenantId, [
      {
        id: `srv-demo-1-${tenantId.slice(0, 4)}`,
        tenantId,
        name: "Executive Dental Consultation & Scaling",
        description: "Comprehensive dental examination, ultrasonic scaling, and polishing.",
        durationMinutes: 45,
        price: 1500,
        pricingModel: "FIXED",
        bufferTimeMinutes: 15,
        category: "Dental",
        isActive: true,
        maxCapacity: 1,
        allowGroupBooking: false,
        depositType: "FIXED",
        depositValue: 500,
        cancellationFee: 300,
        cancellationWindowHours: 24,
      },
      {
        id: `srv-demo-2-${tenantId.slice(0, 4)}`,
        tenantId,
        name: "Group Wellness & Physiotherapy Session",
        description: "Guided rehabilitation and posture correction workshop for small groups.",
        durationMinutes: 60,
        price: 1200,
        pricingModel: "FIXED",
        bufferTimeMinutes: 10,
        category: "Physiotherapy",
        isActive: true,
        maxCapacity: 8,
        allowGroupBooking: true,
        depositType: "PERCENTAGE",
        depositValue: 30,
        cancellationFee: 250,
        cancellationWindowHours: 12,
      },
    ]);
  }
  return fallbackServicesByTenant.get(tenantId)!;
}

function enrichService(s: any) {
  const meta = serviceMetaStore.get(s.id);
  return {
    ...s,
    price: Number(s.price ?? 0),
    maxCapacity: Number(s.maxCapacity ?? meta?.maxCapacity ?? 1),
    allowGroupBooking: Boolean(s.allowGroupBooking ?? meta?.allowGroupBooking ?? false),
    depositType: s.depositType || meta?.depositType || "NONE",
    depositValue: Number(s.depositValue ?? meta?.depositValue ?? 0),
    cancellationFee: Number(s.cancellationFee ?? meta?.cancellationFee ?? 0),
    cancellationWindowHours: Number(
      s.cancellationWindowHours ?? meta?.cancellationWindowHours ?? 24
    ),
  };
}

export async function GET() {
  let tenantId = "demo-tenant";
  try {
    const session = await requireTenant();
    tenantId = session.tenantId;
  } catch (_) {}

  try {
    const services = await prisma.service.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({
      services: services.map(enrichService),
    });
  } catch (_) {
    return NextResponse.json({
      services: getFallbackServices(tenantId).map(enrichService),
    });
  }
}

export async function POST(req: Request) {
  let tenantId = "demo-tenant";
  try {
    const session = await requireTenant();
    tenantId = session.tenantId;
  } catch (_) {}

  try {
    const body = await req.json();
    const {
      name,
      description,
      durationMinutes,
      price,
      pricingModel,
      category,
      bufferTimeMinutes,
      maxCapacity,
      allowGroupBooking,
      depositType,
      depositValue,
      cancellationFee,
      cancellationWindowHours,
    } = body;

    if (!name) {
      return NextResponse.json({ error: "Service name is required" }, { status: 400 });
    }

    const parsedCapacity = allowGroupBooking ? Math.max(2, Number(maxCapacity) || 5) : 1;
    const parsedDepositType = depositType || "NONE";
    const parsedDepositValue = parsedDepositType === "NONE" ? 0 : Number(depositValue) || 0;
    const parsedCancelFee = Number(cancellationFee) || 0;
    const parsedCancelWindow = Number(cancellationWindowHours ?? 24);

    try {
      const service = await prisma.service.create({
        data: {
          tenantId,
          name,
          description,
          durationMinutes: Number(durationMinutes) || 30,
          price: Number(price) || 0,
          pricingModel: pricingModel || "FIXED",
          bufferTimeMinutes: Number(bufferTimeMinutes) || 0,
          category,
          isActive: true,
          maxCapacity: parsedCapacity,
          allowGroupBooking: Boolean(allowGroupBooking),
          depositType: parsedDepositType,
          depositValue: parsedDepositValue,
          cancellationFee: parsedCancelFee,
          cancellationWindowHours: parsedCancelWindow,
        },
      });
      serviceMetaStore.set(service.id, {
        maxCapacity: parsedCapacity,
        allowGroupBooking: Boolean(allowGroupBooking),
        depositType: parsedDepositType,
        depositValue: parsedDepositValue,
        cancellationFee: parsedCancelFee,
        cancellationWindowHours: parsedCancelWindow,
      });
      return NextResponse.json({ success: true, service: enrichService(service) });
    } catch (_) {
      // Fallback if extended columns aren't migrated yet
      try {
        const basicService = await prisma.service.create({
          data: {
            tenantId,
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
        serviceMetaStore.set(basicService.id, {
          maxCapacity: parsedCapacity,
          allowGroupBooking: Boolean(allowGroupBooking),
          depositType: parsedDepositType,
          depositValue: parsedDepositValue,
          cancellationFee: parsedCancelFee,
          cancellationWindowHours: parsedCancelWindow,
        });
        return NextResponse.json({ success: true, service: enrichService(basicService) });
      } catch (__) {
        const fbList = getFallbackServices(tenantId);
        const newSrv = {
          id: `srv-${Date.now()}`,
          tenantId,
          name,
          description,
          durationMinutes: Number(durationMinutes) || 30,
          price: Number(price) || 0,
          pricingModel: pricingModel || "FIXED",
          bufferTimeMinutes: Number(bufferTimeMinutes) || 0,
          category,
          isActive: true,
          maxCapacity: parsedCapacity,
          allowGroupBooking: Boolean(allowGroupBooking),
          depositType: parsedDepositType,
          depositValue: parsedDepositValue,
          cancellationFee: parsedCancelFee,
          cancellationWindowHours: parsedCancelWindow,
        };
        fbList.unshift(newSrv);
        return NextResponse.json({ success: true, service: newSrv });
      }
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create service" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  let tenantId = "demo-tenant";
  try {
    const session = await requireTenant();
    tenantId = session.tenantId;
  } catch (_) {}

  try {
    const body = await req.json();
    const {
      serviceId,
      name,
      description,
      durationMinutes,
      price,
      pricingModel,
      category,
      bufferTimeMinutes,
      isActive,
      maxCapacity,
      allowGroupBooking,
      depositType,
      depositValue,
      cancellationFee,
      cancellationWindowHours,
    } = body;

    if (!serviceId) {
      return NextResponse.json({ error: "serviceId is required" }, { status: 400 });
    }

    const existingMeta = serviceMetaStore.get(serviceId) || {
      maxCapacity: 1,
      allowGroupBooking: false,
      depositType: "NONE",
      depositValue: 0,
      cancellationFee: 0,
      cancellationWindowHours: 24,
    };

    const nextMeta = {
      maxCapacity:
        maxCapacity !== undefined ? Number(maxCapacity) : existingMeta.maxCapacity,
      allowGroupBooking:
        allowGroupBooking !== undefined
          ? Boolean(allowGroupBooking)
          : existingMeta.allowGroupBooking,
      depositType: depositType !== undefined ? depositType : existingMeta.depositType,
      depositValue:
        depositValue !== undefined ? Number(depositValue) : existingMeta.depositValue,
      cancellationFee:
        cancellationFee !== undefined
          ? Number(cancellationFee)
          : existingMeta.cancellationFee,
      cancellationWindowHours:
        cancellationWindowHours !== undefined
          ? Number(cancellationWindowHours)
          : existingMeta.cancellationWindowHours,
    };

    serviceMetaStore.set(serviceId, nextMeta);

    try {
      const existing = await prisma.service.findFirst({
        where: { id: serviceId, tenantId },
      });
      if (existing) {
        try {
          const updated = await prisma.service.update({
            where: { id: serviceId },
            data: {
              ...(name !== undefined && { name }),
              ...(description !== undefined && { description }),
              ...(durationMinutes !== undefined && { durationMinutes: Number(durationMinutes) }),
              ...(price !== undefined && { price: Number(price) }),
              ...(pricingModel !== undefined && { pricingModel }),
              ...(category !== undefined && { category }),
              ...(bufferTimeMinutes !== undefined && {
                bufferTimeMinutes: Number(bufferTimeMinutes),
              }),
              ...(isActive !== undefined && { isActive }),
              ...(maxCapacity !== undefined && { maxCapacity: Number(maxCapacity) }),
              ...(allowGroupBooking !== undefined && {
                allowGroupBooking: Boolean(allowGroupBooking),
              }),
              ...(depositType !== undefined && { depositType }),
              ...(depositValue !== undefined && { depositValue: Number(depositValue) }),
              ...(cancellationFee !== undefined && {
                cancellationFee: Number(cancellationFee),
              }),
              ...(cancellationWindowHours !== undefined && {
                cancellationWindowHours: Number(cancellationWindowHours),
              }),
            },
          });
          return NextResponse.json({ success: true, service: enrichService(updated) });
        } catch (_) {
          // Update only base columns if extended columns are not migrated
          const updatedBasic = await prisma.service.update({
            where: { id: serviceId },
            data: {
              ...(name !== undefined && { name }),
              ...(description !== undefined && { description }),
              ...(durationMinutes !== undefined && { durationMinutes: Number(durationMinutes) }),
              ...(price !== undefined && { price: Number(price) }),
              ...(pricingModel !== undefined && { pricingModel }),
              ...(category !== undefined && { category }),
              ...(bufferTimeMinutes !== undefined && {
                bufferTimeMinutes: Number(bufferTimeMinutes),
              }),
              ...(isActive !== undefined && { isActive }),
            },
          });
          return NextResponse.json({ success: true, service: enrichService(updatedBasic) });
        }
      }
    } catch (_) {}

    const fbList = getFallbackServices(tenantId);
    const target = fbList.find((s) => s.id === serviceId);
    if (target) {
      Object.assign(target, {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(durationMinutes !== undefined && { durationMinutes: Number(durationMinutes) }),
        ...(price !== undefined && { price: Number(price) }),
        ...(pricingModel !== undefined && { pricingModel }),
        ...(category !== undefined && { category }),
        ...(bufferTimeMinutes !== undefined && { bufferTimeMinutes: Number(bufferTimeMinutes) }),
        ...(isActive !== undefined && { isActive }),
        ...nextMeta,
      });
      return NextResponse.json({ success: true, service: target });
    }

    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update service" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  let tenantId = "demo-tenant";
  try {
    const session = await requireTenant();
    tenantId = session.tenantId;
  } catch (_) {}

  try {
    const { searchParams } = new URL(req.url);
    const serviceId = searchParams.get("serviceId");

    if (!serviceId) {
      return NextResponse.json({ error: "serviceId is required" }, { status: 400 });
    }

    try {
      const existing = await prisma.service.findFirst({
        where: { id: serviceId, tenantId },
      });
      if (existing) {
        await prisma.service.update({
          where: { id: serviceId },
          data: { isActive: false },
        });
        return NextResponse.json({ success: true });
      }
    } catch (_) {}

    const fbList = getFallbackServices(tenantId);
    const target = fbList.find((s) => s.id === serviceId);
    if (target) {
      target.isActive = false;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete service" },
      { status: 500 }
    );
  }
}
