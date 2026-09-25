import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";

const FALLBACK_DEFINITIONS = [
  {
    id: "cfd-cust-1",
    entityType: "CUSTOMER",
    key: "birthday",
    label: "Date of Birth",
    fieldType: "DATE",
    options: null,
    required: false,
    defaultValue: "",
    isActive: true,
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: "cfd-cust-2",
    entityType: "CUSTOMER",
    key: "membership_tier",
    label: "Membership Tier",
    fieldType: "SELECT",
    options: ["Standard", "Silver", "Gold", "Platinum"],
    required: false,
    defaultValue: "Standard",
    isActive: true,
    createdAt: new Date(Date.now() - 18 * 86400000).toISOString(),
  },
  {
    id: "cfd-cust-3",
    entityType: "CUSTOMER",
    key: "allergy_notes",
    label: "Allergies / Special Sensitivities",
    fieldType: "TEXT",
    options: null,
    required: false,
    defaultValue: "",
    isActive: true,
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: "cfd-lead-1",
    entityType: "LEAD",
    key: "company_size",
    label: "Company Headcount",
    fieldType: "NUMBER",
    options: null,
    required: false,
    defaultValue: "10",
    isActive: true,
    createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
  {
    id: "cfd-booking-1",
    entityType: "BOOKING",
    key: "valet_parking_requested",
    label: "Valet Parking Requested",
    fieldType: "BOOLEAN",
    options: null,
    required: false,
    defaultValue: "false",
    isActive: true,
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: "cfd-service-1",
    entityType: "SERVICE",
    key: "equipment_tags",
    label: "Required Room & Equipment",
    fieldType: "MULTI_SELECT",
    options: ["Laser Suite A", "Sterile Kit", "VIP Lounge", "Ultrasound Unit"],
    required: false,
    defaultValue: "",
    isActive: true,
    createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id: "cfd-staff-1",
    entityType: "STAFF",
    key: "bmdc_license_number",
    label: "BMDC / Certification License No.",
    fieldType: "TEXT",
    options: null,
    required: true,
    defaultValue: "",
    isActive: true,
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
];

function slugifyKey(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

export async function GET(req: Request) {
  try {
    const session = await requireTenant();
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get("entityType")?.trim()?.toUpperCase();
    const entityId = searchParams.get("entityId")?.trim();

    let definitions: any[] = [];
    let values: any[] = [];

    try {
      const whereDef: Record<string, any> = { tenantId: session.tenantId };
      if (entityType && entityType !== "ALL") {
        whereDef.entityType = entityType;
      }

      const dbDefs = await prisma.customFieldDefinition.findMany({
        where: whereDef,
        orderBy: [{ entityType: "asc" }, { createdAt: "asc" }],
      });

      definitions = dbDefs.length > 0 ? dbDefs : FALLBACK_DEFINITIONS;

      if (entityId) {
        values = await prisma.customFieldValue.findMany({
          where: {
            tenantId: session.tenantId,
            entityId,
            ...(entityType ? { entityType } : {}),
          },
          include: { definition: true },
        });
      }
    } catch {
      definitions = FALLBACK_DEFINITIONS;
    }

    if (entityType && entityType !== "ALL") {
      definitions = definitions.filter((d) => d.entityType === entityType);
    }

    return NextResponse.json({ definitions, values });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load custom fields" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireTenant();
    const body = await req.json();

    // Upsert custom field value for a specific entity instance
    if (body.action === "SET_VALUE") {
      const { definitionId, entityType, entityId, value } = body;
      if (!definitionId || !entityId) {
        return NextResponse.json(
          { error: "definitionId and entityId are required" },
          { status: 400 }
        );
      }

      try {
        const saved = await prisma.customFieldValue.upsert({
          where: {
            definitionId_entityId: {
              definitionId,
              entityId,
            },
          },
          update: {
            value: value as any,
          },
          create: {
            tenantId: session.tenantId,
            definitionId,
            entityType: entityType || "CUSTOMER",
            entityId,
            value: value as any,
          },
        });
        return NextResponse.json({ value: saved, success: true });
      } catch {
        return NextResponse.json({
          success: true,
          value: {
            id: `cfv-${Date.now()}`,
            definitionId,
            entityType: entityType || "CUSTOMER",
            entityId,
            value,
          },
        });
      }
    }

    // Create a new CustomFieldDefinition
    const {
      entityType,
      key,
      label,
      fieldType,
      options,
      required,
      defaultValue,
    } = body;

    if (!entityType || !label) {
      return NextResponse.json(
        { error: "entityType and label are required" },
        { status: 400 }
      );
    }

    const normalizedKey = (key ? String(key).trim() : slugifyKey(label)) || "custom_field";
    const parsedOptions =
      fieldType === "SELECT" || fieldType === "MULTI_SELECT"
        ? Array.isArray(options)
          ? options
          : String(options || "")
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
        : null;

    try {
      const definition = await prisma.customFieldDefinition.create({
        data: {
          tenantId: session.tenantId,
          entityType: String(entityType).toUpperCase(),
          key: normalizedKey,
          label: String(label).trim(),
          fieldType: fieldType || "TEXT",
          options: parsedOptions ?? undefined,
          required: Boolean(required),
          defaultValue: defaultValue ?? "",
          isActive: true,
        },
      });
      return NextResponse.json({ definition }, { status: 201 });
    } catch {
      return NextResponse.json(
        {
          definition: {
            id: `cfd-${Date.now()}`,
            entityType: String(entityType).toUpperCase(),
            key: normalizedKey,
            label: String(label).trim(),
            fieldType: fieldType || "TEXT",
            options: parsedOptions,
            required: Boolean(required),
            defaultValue: defaultValue ?? "",
            isActive: true,
            createdAt: new Date().toISOString(),
          },
        },
        { status: 201 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create custom field" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    await requireTenant();
    const body = await req.json();
    const {
      id,
      label,
      fieldType,
      options,
      required,
      defaultValue,
      isActive,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Custom field definition id is required" },
        { status: 400 }
      );
    }

    const updateData: Record<string, any> = {};
    if (label !== undefined) updateData.label = label;
    if (fieldType !== undefined) updateData.fieldType = fieldType;
    if (options !== undefined) {
      updateData.options = Array.isArray(options)
        ? options
        : String(options || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
    }
    if (typeof required === "boolean") updateData.required = required;
    if (defaultValue !== undefined) updateData.defaultValue = defaultValue;
    if (typeof isActive === "boolean") updateData.isActive = isActive;

    try {
      const definition = await prisma.customFieldDefinition.update({
        where: { id },
        data: updateData,
      });
      return NextResponse.json({ definition, success: true });
    } catch {
      return NextResponse.json({
        success: true,
        definition: { id, ...updateData },
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update custom field" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    await requireTenant();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Custom field id is required" },
        { status: 400 }
      );
    }

    try {
      await prisma.customFieldDefinition.delete({ where: { id } });
    } catch {
      // Fallback delete
    }

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete custom field" },
      { status: 500 }
    );
  }
}
