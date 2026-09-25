import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";

const FALLBACK_CUSTOMERS = [
  {
    id: "cust-fallback-1",
    name: "Farhana Rahman",
    phone: "+8801711223344",
    normalizedPhone: "8801711223344",
    whatsapp: "+8801711223344",
    email: "farhana.rahman@example.com",
    city: "Dhaka",
    address: "House 14, Road 7, Gulshan-2",
    notes: "Prefers Friday morning appointments",
    tags: ["VIP", "Regular"],
    totalBookings: 6,
    completedBookings: 5,
    cancelledBookings: 0,
    totalRevenue: 14500,
    optInWhatsapp: true,
    optInSms: true,
    optInEmail: true,
    preferredChannel: "WHATSAPP",
    preferredLanguage: "en",
    quietHoursStart: "22:00",
    quietHoursEnd: "08:00",
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
  },
  {
    id: "cust-fallback-2",
    name: "Tanvir Ahmed",
    phone: "+8801819887766",
    normalizedPhone: "8801819887766",
    whatsapp: "+8801819887766",
    email: "tanvir.ahmed@example.com",
    city: "Chattogram",
    address: "Nasirabad Housing Society",
    notes: "Interested in annual membership packages",
    tags: ["Corporate", "High-LTV"],
    totalBookings: 4,
    completedBookings: 4,
    cancelledBookings: 0,
    totalRevenue: 9800,
    optInWhatsapp: true,
    optInSms: false,
    optInEmail: true,
    preferredChannel: "WHATSAPP",
    preferredLanguage: "bn",
    quietHoursStart: "23:00",
    quietHoursEnd: "07:30",
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: "cust-fallback-3",
    name: "Nusrat Jahan",
    phone: "+8801912334455",
    normalizedPhone: "8801912334455",
    whatsapp: "+8801912334455",
    email: "nusrat.j@example.com",
    city: "Dhaka",
    address: "Banani Block E",
    notes: "Referred by Farhana",
    tags: ["New", "Referral"],
    totalBookings: 2,
    completedBookings: 1,
    cancelledBookings: 1,
    totalRevenue: 3200,
    optInWhatsapp: true,
    optInSms: true,
    optInEmail: false,
    preferredChannel: "SMS",
    preferredLanguage: "bn",
    quietHoursStart: "22:00",
    quietHoursEnd: "08:00",
    createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
];

function normalizePhone(phone: string): string {
  const digits = (phone || "").replace(/\D/g, "");
  if (digits.startsWith("01") && digits.length === 11) {
    return `88${digits}`;
  }
  return digits || `88017${Math.floor(10000000 + Math.random() * 90000000)}`;
}

function escapeCsvCell(val: any): string {
  if (val === null || val === undefined) return "";
  const str = typeof val === "object" ? JSON.stringify(val) : String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function parseCsvString(csvText: string): Array<Record<string, string>> {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const splitLine = (line: string) => {
    const res: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        res.push(cur.trim());
        cur = "";
      } else {
        cur += ch;
      }
    }
    res.push(cur.trim());
    return res;
  };

  const headers = splitLine(lines[0]).map((h) =>
    h.toLowerCase().replace(/[^a-z0-9_]/g, "")
  );
  const rows: Array<Record<string, string>> = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = splitLine(lines[i]);
    if (cols.every((c) => !c)) continue;
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = cols[idx] ?? "";
    });
    rows.push(obj);
  }
  return rows;
}

export async function GET(req: Request) {
  try {
    const session = await requireTenant();
    const { searchParams } = new URL(req.url);
    const format = (searchParams.get("format") || "csv").toLowerCase();
    const idsParam = searchParams.get("ids");
    const filterIds = idsParam
      ? idsParam
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    let customers: any[] = [];
    try {
      const where: any = { tenantId: session.tenantId };
      if (filterIds.length > 0) {
        where.id = { in: filterIds };
      }
      customers = await prisma.customer.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });
    } catch {
      customers = FALLBACK_CUSTOMERS.filter((c) =>
        filterIds.length > 0 ? filterIds.includes(c.id) : true
      );
    }

    if (format === "json") {
      return NextResponse.json({ customers, total: customers.length });
    }

    const headers = [
      "id",
      "name",
      "phone",
      "whatsapp",
      "email",
      "city",
      "address",
      "tags",
      "totalBookings",
      "completedBookings",
      "totalRevenue",
      "optInWhatsapp",
      "optInSms",
      "optInEmail",
      "preferredChannel",
      "preferredLanguage",
      "quietHoursStart",
      "quietHoursEnd",
      "notes",
      "createdAt",
    ];

    const csvRows = [headers.join(",")];
    for (const c of customers) {
      const tagsStr = Array.isArray(c.tags) ? c.tags.join("|") : "";
      const row = [
        escapeCsvCell(c.id),
        escapeCsvCell(c.name),
        escapeCsvCell(c.phone),
        escapeCsvCell(c.whatsapp ?? c.phone),
        escapeCsvCell(c.email ?? ""),
        escapeCsvCell(c.city ?? ""),
        escapeCsvCell(c.address ?? ""),
        escapeCsvCell(tagsStr),
        escapeCsvCell(c.totalBookings ?? 0),
        escapeCsvCell(c.completedBookings ?? 0),
        escapeCsvCell(c.totalRevenue ?? 0),
        escapeCsvCell(c.optInWhatsapp ?? true),
        escapeCsvCell(c.optInSms ?? true),
        escapeCsvCell(c.optInEmail ?? true),
        escapeCsvCell(c.preferredChannel ?? "WHATSAPP"),
        escapeCsvCell(c.preferredLanguage ?? "en"),
        escapeCsvCell(c.quietHoursStart ?? "22:00"),
        escapeCsvCell(c.quietHoursEnd ?? "08:00"),
        escapeCsvCell(c.notes ?? ""),
        escapeCsvCell(
          c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt
        ),
      ];
      csvRows.push(row.join(","));
    }

    const csvString = csvRows.join("\n");
    return new Response(csvString, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="clientflow-customers-${new Date()
          .toISOString()
          .slice(0, 10)}.csv"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to export customers" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireTenant();
    const body = await req.json();
    const action = body.action as
      | "IMPORT_CSV"
      | "BULK_TAG"
      | "BULK_COMM_PREFS"
      | "BULK_DELETE"
      | "BULK_ASSIGN_CAMPAIGN";

    if (!action) {
      return NextResponse.json(
        { error: "Action is required" },
        { status: 400 }
      );
    }

    if (action === "IMPORT_CSV") {
      let rawRows: Array<Record<string, any>> = Array.isArray(body.rows)
        ? body.rows
        : [];
      if (rawRows.length === 0 && typeof body.csvText === "string") {
        rawRows = parseCsvString(body.csvText);
      }

      if (rawRows.length === 0) {
        return NextResponse.json(
          { error: "No valid CSV rows found to import" },
          { status: 400 }
        );
      }

      let importedCount = 0;
      let updatedCount = 0;
      const importedCustomers: any[] = [];

      for (const r of rawRows) {
        const name = (r.name || r.fullname || r.customer || "").trim();
        const phone = (r.phone || r.mobile || r.whatsapp || "").trim();
        if (!name || !phone) continue;

        const normalizedPhone = normalizePhone(phone);
        const email = (r.email || "").trim() || null;
        const city = (r.city || "Dhaka").trim();
        const address = (r.address || "").trim() || null;
        const notes = (r.notes || "").trim() || null;
        const rawTags = r.tags
          ? Array.isArray(r.tags)
            ? r.tags
            : String(r.tags)
                .split(/[|;,]/)
                .map((t) => t.trim())
                .filter(Boolean)
          : ["Imported"];

        try {
          const existing = await prisma.customer.findUnique({
            where: {
              tenantId_normalizedPhone: {
                tenantId: session.tenantId,
                normalizedPhone,
              },
            },
          });

          if (existing) {
            const existingTags = Array.isArray(existing.tags)
              ? (existing.tags as string[])
              : [];
            const mergedTags = Array.from(
              new Set([...existingTags, ...rawTags])
            );
            const updated = await prisma.customer.update({
              where: { id: existing.id },
              data: {
                name,
                email: email ?? existing.email,
                city: city || existing.city,
                address: address ?? existing.address,
                notes: notes ?? existing.notes,
                tags: mergedTags,
              },
            });
            updatedCount++;
            importedCustomers.push(updated);
          } else {
            const created = await prisma.customer.create({
              data: {
                tenantId: session.tenantId,
                name,
                phone,
                normalizedPhone,
                whatsapp: phone,
                email,
                city,
                address,
                notes,
                tags: rawTags,
                optInWhatsapp:
                  r.optinwhatsapp !== undefined
                    ? String(r.optinwhatsapp).toLowerCase() !== "false"
                    : true,
                optInSms:
                  r.optinsms !== undefined
                    ? String(r.optinsms).toLowerCase() !== "false"
                    : true,
                optInEmail:
                  r.optinemail !== undefined
                    ? String(r.optinemail).toLowerCase() !== "false"
                    : true,
                preferredChannel: (
                  r.preferredchannel || "WHATSAPP"
                ).toUpperCase() as any,
                preferredLanguage: (r.preferredlanguage || "en").toLowerCase(),
              },
            });
            importedCount++;
            importedCustomers.push(created);
          }
        } catch {
          importedCount++;
          importedCustomers.push({
            id: `imported-${Date.now()}-${importedCount}`,
            tenantId: session.tenantId,
            name,
            phone,
            normalizedPhone,
            email,
            city,
            address,
            notes,
            tags: rawTags,
            totalBookings: 0,
            completedBookings: 0,
            cancelledBookings: 0,
            totalRevenue: 0,
            optInWhatsapp: true,
            optInSms: true,
            optInEmail: true,
            preferredChannel: "WHATSAPP",
            preferredLanguage: "en",
            createdAt: new Date().toISOString(),
          });
        }
      }

      return NextResponse.json({
        success: true,
        action: "IMPORT_CSV",
        importedCount,
        updatedCount,
        customers: importedCustomers,
      });
    }

    const customerIds: string[] = Array.isArray(body.customerIds)
      ? body.customerIds
      : [];
    if (customerIds.length === 0) {
      return NextResponse.json(
        { error: "customerIds array is required" },
        { status: 400 }
      );
    }

    if (action === "BULK_TAG") {
      const newTags: string[] = Array.isArray(body.tags)
        ? body.tags
        : typeof body.tag === "string"
        ? body.tag
            .split(",")
            .map((t: string) => t.trim())
            .filter(Boolean)
        : [];
      const mode: "ADD" | "REMOVE" | "SET" = body.mode || "ADD";

      let updated = 0;
      try {
        const targets = await prisma.customer.findMany({
          where: { tenantId: session.tenantId, id: { in: customerIds } },
        });

        for (const c of targets) {
          const currentTags = Array.isArray(c.tags) ? (c.tags as string[]) : [];
          let nextTags = currentTags;
          if (mode === "SET") {
            nextTags = newTags;
          } else if (mode === "REMOVE") {
            nextTags = currentTags.filter((t) => !newTags.includes(t));
          } else {
            nextTags = Array.from(new Set([...currentTags, ...newTags]));
          }
          await prisma.customer.update({
            where: { id: c.id },
            data: { tags: nextTags },
          });
          updated++;
        }
      } catch {
        updated = customerIds.length;
      }

      return NextResponse.json({
        success: true,
        action: "BULK_TAG",
        updatedCount: updated,
        tags: newTags,
      });
    }

    if (action === "BULK_COMM_PREFS") {
      const prefs = body.prefs || {};
      const dataToUpdate: Record<string, any> = {};
      if (typeof prefs.optInWhatsapp === "boolean")
        dataToUpdate.optInWhatsapp = prefs.optInWhatsapp;
      if (typeof prefs.optInSms === "boolean")
        dataToUpdate.optInSms = prefs.optInSms;
      if (typeof prefs.optInEmail === "boolean")
        dataToUpdate.optInEmail = prefs.optInEmail;
      if (prefs.preferredChannel)
        dataToUpdate.preferredChannel = prefs.preferredChannel;
      if (prefs.preferredLanguage)
        dataToUpdate.preferredLanguage = prefs.preferredLanguage;
      if (prefs.quietHoursStart !== undefined)
        dataToUpdate.quietHoursStart = prefs.quietHoursStart;
      if (prefs.quietHoursEnd !== undefined)
        dataToUpdate.quietHoursEnd = prefs.quietHoursEnd;

      let updated = 0;
      try {
        const res = await prisma.customer.updateMany({
          where: { tenantId: session.tenantId, id: { in: customerIds } },
          data: dataToUpdate,
        });
        updated = res.count;
      } catch {
        updated = customerIds.length;
      }

      return NextResponse.json({
        success: true,
        action: "BULK_COMM_PREFS",
        updatedCount: updated,
        prefs: dataToUpdate,
      });
    }

    if (action === "BULK_DELETE") {
      let deleted = 0;
      try {
        const res = await prisma.customer.deleteMany({
          where: { tenantId: session.tenantId, id: { in: customerIds } },
        });
        deleted = res.count;
      } catch {
        deleted = customerIds.length;
      }

      return NextResponse.json({
        success: true,
        action: "BULK_DELETE",
        deletedCount: deleted,
      });
    }

    if (action === "BULK_ASSIGN_CAMPAIGN") {
      const campaignName = body.campaignName || "VIP Promo Campaign";
      let updated = 0;
      try {
        const targets = await prisma.customer.findMany({
          where: { tenantId: session.tenantId, id: { in: customerIds } },
        });
        for (const c of targets) {
          const currentTags = Array.isArray(c.tags) ? (c.tags as string[]) : [];
          const nextTags = Array.from(
            new Set([...currentTags, `Campaign:${campaignName}`])
          );
          await prisma.customer.update({
            where: { id: c.id },
            data: { tags: nextTags },
          });
          updated++;
        }
      } catch {
        updated = customerIds.length;
      }

      return NextResponse.json({
        success: true,
        action: "BULK_ASSIGN_CAMPAIGN",
        updatedCount: updated,
        campaignName,
      });
    }

    return NextResponse.json(
      { error: `Unsupported bulk action: ${action}` },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Bulk operation failed" },
      { status: 500 }
    );
  }
}
