import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/v1/staff — list all staff for the tenant with branch info
export async function GET(req: Request) {
  try {
    const session = await requireTenant();
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");

    const where: any = { tenantId: session.tenantId };
    if (branchId) {
      where.branchId = branchId;
    }

    const [staff, branches] = await Promise.all([
      prisma.staff.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, phone: true } },
          branch: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.branch.findMany({
        where: { tenantId: session.tenantId, status: "ACTIVE" },
        select: { id: true, name: true, isMain: true },
        orderBy: [{ isMain: "desc" }, { name: "asc" }],
      }),
    ]);

    return NextResponse.json({ staff, branches });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load staff" },
      { status: 500 }
    );
  }
}

// POST /api/v1/staff — create a new staff member with branch assignment
export async function POST(req: Request) {
  try {
    const session = await requireTenant();
    const body = await req.json();
    const { name, phone, email, role, photo, branchId } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Staff name is required" },
        { status: 400 }
      );
    }

    const member = await prisma.staff.create({
      data: {
        tenantId: session.tenantId,
        name: name.trim(),
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        role: role?.trim() || null,
        photo: photo?.trim() || null,
        branchId: branchId || null,
        status: "ACTIVE",
      },
      include: {
        user: { select: { id: true, email: true, phone: true } },
        branch: true,
      },
    });

    return NextResponse.json({ success: true, staff: member }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create staff member" },
      { status: 500 }
    );
  }
}

// PATCH /api/v1/staff — update a staff member (including branch assignment)
export async function PATCH(req: Request) {
  try {
    const session = await requireTenant();
    const body = await req.json();
    const { staffId, name, phone, email, role, photo, branchId, status } = body;

    if (!staffId) {
      return NextResponse.json(
        { error: "staffId is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.staff.findFirst({
      where: { id: staffId, tenantId: session.tenantId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.staff.update({
      where: { id: staffId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(phone !== undefined && { phone: phone?.trim() || null }),
        ...(email !== undefined && { email: email?.trim() || null }),
        ...(role !== undefined && { role: role?.trim() || null }),
        ...(photo !== undefined && { photo: photo?.trim() || null }),
        ...(branchId !== undefined && { branchId: branchId || null }),
        ...(status !== undefined && { status }),
      },
      include: {
        user: { select: { id: true, email: true, phone: true } },
        branch: true,
      },
    });

    return NextResponse.json({ success: true, staff: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update staff member" },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/staff?staffId=xxx — soft-delete by setting status to INACTIVE
export async function DELETE(req: Request) {
  try {
    const session = await requireTenant();
    const { searchParams } = new URL(req.url);
    const staffId = searchParams.get("staffId");

    if (!staffId) {
      return NextResponse.json(
        { error: "staffId query param is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.staff.findFirst({
      where: { id: staffId, tenantId: session.tenantId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }

    await prisma.staff.update({
      where: { id: staffId },
      data: { status: "INACTIVE" },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to deactivate staff member" },
      { status: 500 }
    );
  }
}
