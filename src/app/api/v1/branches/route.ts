import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await requireTenant();
    const tenantId = session.tenantId;

    const [branches, holidays] = await Promise.all([
      prisma.branch.findMany({
        where: { tenantId },
        include: {
          _count: { select: { staff: true, bookings: true } },
        },
        orderBy: [{ isMain: "desc" }, { createdAt: "asc" }],
      }),
      prisma.holiday.findMany({
        where: { tenantId },
        orderBy: { startDate: "asc" },
      }),
    ]);

    return NextResponse.json({ branches, holidays });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load branches & holidays" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireTenant();
    const body = await req.json();
    const tenantId = session.tenantId;

    // If creating a Holiday blackout range
    if (body.entity === "HOLIDAY") {
      const { startDate, endDate, reason, branchId } = body;
      if (!startDate || !endDate) {
        return NextResponse.json(
          { error: "Start date and end date are required" },
          { status: 400 }
        );
      }

      const holiday = await prisma.holiday.create({
        data: {
          tenantId,
          branchId: branchId || null,
          startDate: new Date(`${startDate}T00:00:00`),
          endDate: new Date(`${endDate}T23:59:59`),
          reason: reason || "Public Holiday",
        },
      });

      return NextResponse.json({ success: true, holiday });
    }

    // Otherwise create a Branch
    const { name, address, phone, isMain } = body;
    if (!name) {
      return NextResponse.json(
        { error: "Branch name is required" },
        { status: 400 }
      );
    }

    if (isMain) {
      await prisma.branch.updateMany({
        where: { tenantId },
        data: { isMain: false },
      });
    }

    const branch = await prisma.branch.create({
      data: {
        tenantId,
        name,
        address: address || null,
        phone: phone || null,
        isMain: Boolean(isMain),
        status: "ACTIVE",
      },
      include: {
        _count: { select: { staff: true, bookings: true } },
      },
    });

    return NextResponse.json({ success: true, branch });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create record" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await requireTenant();
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const holidayId = searchParams.get("holidayId");

    if (holidayId) {
      await prisma.holiday.deleteMany({
        where: { id: holidayId, tenantId: session.tenantId },
      });
      return NextResponse.json({ success: true });
    }

    if (branchId) {
      await prisma.branch.deleteMany({
        where: { id: branchId, tenantId: session.tenantId },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "branchId or holidayId is required" },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete record" },
      { status: 500 }
    );
  }
}
