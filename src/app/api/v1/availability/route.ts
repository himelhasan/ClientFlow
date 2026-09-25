import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await requireTenant();

    const availability = await prisma.availability.findMany({
      where: {
        tenantId: session.tenantId,
        staffId: null,
        branchId: null,
      },
      orderBy: { dayOfWeek: "asc" },
    });

    return NextResponse.json({ availability });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load availability" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireTenant();
    const body = await req.json();

    const {
      dayOfWeek,
      startTime,
      endTime,
      isWorkingDay,
      breakStart,
      breakEnd,
    } = body;

    if (dayOfWeek === undefined || dayOfWeek === null) {
      return NextResponse.json(
        { error: "dayOfWeek is required (0 = Sunday … 6 = Saturday)" },
        { status: 400 }
      );
    }

    const day = Number(dayOfWeek);
    if (day < 0 || day > 6 || !Number.isInteger(day)) {
      return NextResponse.json(
        { error: "dayOfWeek must be an integer between 0 and 6" },
        { status: 400 }
      );
    }

    // Build a deterministic unique key: tenantId + dayOfWeek + staffId=null + branchId=null.
    // Prisma upsert requires a @unique constraint; since there is no compound unique on
    // (tenantId, dayOfWeek, staffId, branchId) in the schema we use findFirst + create/update.
    const existing = await prisma.availability.findFirst({
      where: {
        tenantId: session.tenantId,
        dayOfWeek: day,
        staffId: null,
        branchId: null,
      },
    });

    const data = {
      startTime: startTime ?? "09:00",
      endTime: endTime ?? "18:00",
      isWorkingDay: typeof isWorkingDay === "boolean" ? isWorkingDay : true,
      breakStart: breakStart ?? null,
      breakEnd: breakEnd ?? null,
    };

    let record;
    if (existing) {
      record = await prisma.availability.update({
        where: { id: existing.id },
        data,
      });
    } else {
      record = await prisma.availability.create({
        data: {
          tenantId: session.tenantId,
          dayOfWeek: day,
          staffId: null,
          branchId: null,
          ...data,
        },
      });
    }

    return NextResponse.json({ success: true, availability: record });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to save availability" },
      { status: 500 }
    );
  }
}
