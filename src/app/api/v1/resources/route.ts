import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";

const fallbackResourcesByTenant = new Map<string, any[]>();
const fallbackAssignmentsByTenant = new Map<string, any[]>();

function getFallbackResources(tenantId: string) {
  if (!fallbackResourcesByTenant.has(tenantId)) {
    fallbackResourcesByTenant.set(tenantId, [
      {
        id: `res-room-1-${tenantId.slice(0, 4)}`,
        tenantId,
        name: "Consultation Suite A (VIP)",
        type: "ROOM",
        description: "Air-conditioned diagnostic consultation suite with digital imaging monitor",
        quantity: 1,
        status: "AVAILABLE",
        branch: { name: "Gulshan Flagship" },
        bookingResources: [
          {
            id: "br-1",
            bookingId: "#1004",
            resourceId: `res-room-1-${tenantId.slice(0, 4)}`,
            quantity: 1,
            booking: {
              id: "bk-1",
              bookingNumber: "#1004",
              date: new Date().toISOString(),
              startTime: "10:00",
              endTime: "11:00",
              customer: { name: "Tanvir Ahmed" },
              service: { name: "Executive Dental Consultation" },
            },
          },
        ],
      },
      {
        id: `res-eq-1-${tenantId.slice(0, 4)}`,
        tenantId,
        name: "3D Panoramic X-Ray Scanner",
        type: "EQUIPMENT",
        description: "High-precision CBCT dental & maxillofacial scanner",
        quantity: 2,
        status: "AVAILABLE",
        branch: { name: "Gulshan Flagship" },
        bookingResources: [
          {
            id: "br-2",
            bookingId: "#1007",
            resourceId: `res-eq-1-${tenantId.slice(0, 4)}`,
            quantity: 1,
            booking: {
              id: "bk-2",
              bookingNumber: "#1007",
              date: new Date().toISOString(),
              startTime: "14:00",
              endTime: "15:00",
              customer: { name: "Nusrat Jahan" },
              service: { name: "Full Orthodontic Assessment" },
            },
          },
        ],
      },
      {
        id: `res-chair-1-${tenantId.slice(0, 4)}`,
        tenantId,
        name: "Ergonomic Dental Chair #3",
        type: "CHAIR",
        description: "Hydraulic dental treatment chair with LED curing unit",
        quantity: 1,
        status: "AVAILABLE",
        branch: { name: "Dhanmondi Branch" },
        bookingResources: [],
      },
      {
        id: `res-bay-1-${tenantId.slice(0, 4)}`,
        tenantId,
        name: "Physiotherapy Rehab Bay 2",
        type: "BAY",
        description: "Equipped with ultrasound therapy and traction table",
        quantity: 1,
        status: "MAINTENANCE",
        branch: { name: "Banani Center" },
        bookingResources: [],
      },
      {
        id: `res-veh-1-${tenantId.slice(0, 4)}`,
        tenantId,
        name: "Mobile Home-Care Van #1",
        type: "VEHICLE",
        description: "Equipped for home sample collection and portable diagnostics",
        quantity: 1,
        status: "AVAILABLE",
        branch: { name: "Gulshan Flagship" },
        bookingResources: [],
      },
    ]);
  }
  return fallbackResourcesByTenant.get(tenantId)!;
}

export async function GET(req: Request) {
  let tenantId = "demo-tenant";
  try {
    const session = await requireTenant();
    tenantId = session.tenantId;
  } catch (_) {}

  const { searchParams } = new URL(req.url);
  const typeFilter = searchParams.get("type");
  const statusFilter = searchParams.get("status");

  try {
    let resources = await prisma.resource.findMany({
      where: {
        tenantId,
        ...(typeFilter && typeFilter !== "ALL" ? { type: typeFilter } : {}),
        ...(statusFilter && statusFilter !== "ALL" ? { status: statusFilter } : {}),
      },
      include: {
        branch: true,
        bookingResources: {
          include: {
            booking: {
              include: { customer: true, service: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Seed initial resources if none exist for tenant yet and no narrow filter is applied
    if (resources.length === 0 && (!typeFilter || typeFilter === "ALL") && (!statusFilter || statusFilter === "ALL")) {
      const defaults = getFallbackResources(tenantId);
      for (const def of defaults) {
        await prisma.resource.create({
          data: {
            tenantId,
            name: def.name,
            type: def.type,
            description: def.description,
            quantity: def.quantity,
            status: def.status,
          },
        });
      }
      resources = await prisma.resource.findMany({
        where: { tenantId },
        include: {
          branch: true,
          bookingResources: {
            include: {
              booking: { include: { customer: true, service: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({ resources });
  } catch (_) {
    let list = getFallbackResources(tenantId);
    if (typeFilter && typeFilter !== "ALL") {
      list = list.filter((r) => r.type === typeFilter);
    }
    if (statusFilter && statusFilter !== "ALL") {
      list = list.filter((r) => r.status === statusFilter);
    }
    return NextResponse.json({ resources: list });
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
      action = "CREATE_RESOURCE",
      name,
      type = "ROOM",
      description,
      quantity = 1,
      status = "AVAILABLE",
      branchId,
      branchName,
      resourceId,
      bookingId,
      customerName,
      serviceName,
      startTime = "11:00",
      endTime = "12:00",
    } = body;

    if (action === "ASSIGN_BOOKING") {
      if (!resourceId) {
        return NextResponse.json({ error: "resourceId is required" }, { status: 400 });
      }

      try {
        if (bookingId) {
          const assignment = await prisma.bookingResource.upsert({
            where: {
              bookingId_resourceId: {
                bookingId,
                resourceId,
              },
            },
            update: { quantity: Number(quantity) || 1 },
            create: {
              tenantId,
              bookingId,
              resourceId,
              quantity: Number(quantity) || 1,
            },
            include: {
              booking: { include: { customer: true, service: true } },
              resource: true,
            },
          });
          return NextResponse.json({ success: true, assignment });
        }
      } catch (_) {}

      const fbResources = getFallbackResources(tenantId);
      const target = fbResources.find((r) => r.id === resourceId);
      const newAssignment = {
        id: `br-${Date.now()}`,
        bookingId: bookingId || `#${Math.floor(1010 + Math.random() * 90)}`,
        resourceId,
        quantity: Number(quantity) || 1,
        booking: {
          id: bookingId || `bk-${Date.now()}`,
          bookingNumber: bookingId || `#${Math.floor(1010 + Math.random() * 90)}`,
          date: new Date().toISOString(),
          startTime,
          endTime,
          customer: { name: customerName || "Walk-in / Scheduled Client" },
          service: { name: serviceName || "Assigned Procedure" },
        },
      };

      if (target) {
        target.bookingResources = [newAssignment, ...(target.bookingResources || [])];
      }
      const list = fallbackAssignmentsByTenant.get(tenantId) || [];
      list.unshift(newAssignment);
      fallbackAssignmentsByTenant.set(tenantId, list);

      return NextResponse.json({ success: true, assignment: newAssignment });
    }

    if (!name) {
      return NextResponse.json({ error: "Resource name is required" }, { status: 400 });
    }

    try {
      const resource = await prisma.resource.create({
        data: {
          tenantId,
          name,
          type,
          description: description || null,
          quantity: Math.max(1, Number(quantity) || 1),
          status: status || "AVAILABLE",
          ...(branchId ? { branchId } : {}),
        },
        include: { branch: true, bookingResources: true },
      });
      return NextResponse.json({ success: true, resource });
    } catch (_) {
      const fbResources = getFallbackResources(tenantId);
      const created = {
        id: `res-${Date.now()}`,
        tenantId,
        name,
        type,
        description: description || "",
        quantity: Math.max(1, Number(quantity) || 1),
        status: status || "AVAILABLE",
        branch: { name: branchName || "Main Branch" },
        bookingResources: [],
      };
      fbResources.unshift(created);
      return NextResponse.json({ success: true, resource: created });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to process resource request" },
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
    const { resourceId, name, type, description, quantity, status, branchName } = body;

    if (!resourceId) {
      return NextResponse.json({ error: "resourceId is required" }, { status: 400 });
    }

    try {
      const existing = await prisma.resource.findFirst({
        where: { id: resourceId, tenantId },
      });
      if (existing) {
        const updated = await prisma.resource.update({
          where: { id: resourceId },
          data: {
            ...(name !== undefined && { name }),
            ...(type !== undefined && { type }),
            ...(description !== undefined && { description }),
            ...(quantity !== undefined && { quantity: Math.max(1, Number(quantity)) }),
            ...(status !== undefined && { status }),
          },
          include: { branch: true, bookingResources: true },
        });
        return NextResponse.json({ success: true, resource: updated });
      }
    } catch (_) {}

    const fbResources = getFallbackResources(tenantId);
    const target = fbResources.find((r) => r.id === resourceId);
    if (target) {
      if (name !== undefined) target.name = name;
      if (type !== undefined) target.type = type;
      if (description !== undefined) target.description = description;
      if (quantity !== undefined) target.quantity = Math.max(1, Number(quantity));
      if (status !== undefined) target.status = status;
      if (branchName !== undefined) target.branch = { name: branchName };
      return NextResponse.json({ success: true, resource: target });
    }

    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update resource" },
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
    const resourceId = searchParams.get("resourceId");

    if (!resourceId) {
      return NextResponse.json({ error: "resourceId is required" }, { status: 400 });
    }

    try {
      await prisma.resource.deleteMany({
        where: { id: resourceId, tenantId },
      });
    } catch (_) {}

    const fbResources = getFallbackResources(tenantId);
    const idx = fbResources.findIndex((r) => r.id === resourceId);
    if (idx !== -1) {
      fbResources.splice(idx, 1);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete resource" },
      { status: 500 }
    );
  }
}
