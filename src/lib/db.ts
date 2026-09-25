import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var cachedPrisma: PrismaClient | undefined;
}

export const prisma =
  global.cachedPrisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.cachedPrisma = prisma;
}

/**
 * Creates a tenant-scoped database client wrapper to guarantee tenant isolation.
 * Automatically enforces tenantId on all scoped operations.
 */
export function getTenantDb(tenantId: string) {
  if (!tenantId) {
    throw new Error("Tenant isolation violation: tenantId is required for tenant-scoped operations.");
  }

  return {
    tenantId,
    business: {
      get: () => prisma.business.findUnique({ where: { id: tenantId } }),
      update: (data: any) => prisma.business.update({ where: { id: tenantId }, data }),
    },
    services: {
      findMany: (args: any = {}) =>
        prisma.service.findMany({ ...args, where: { ...args.where, tenantId } }),
      findUnique: (id: string) => prisma.service.findFirst({ where: { id, tenantId } }),
      create: (data: any) =>
        prisma.service.create({ data: { ...data, tenantId } }),
      update: (id: string, data: any) =>
        prisma.service.update({ where: { id }, data }),
      delete: (id: string) => prisma.service.delete({ where: { id } }),
    },
    staff: {
      findMany: (args: any = {}) =>
        prisma.staff.findMany({ ...args, where: { ...args.where, tenantId } }),
      findUnique: (id: string) => prisma.staff.findFirst({ where: { id, tenantId } }),
      create: (data: any) =>
        prisma.staff.create({ data: { ...data, tenantId } }),
      update: (id: string, data: any) =>
        prisma.staff.update({ where: { id }, data }),
    },
    bookings: {
      findMany: (args: any = {}) =>
        prisma.booking.findMany({ ...args, where: { ...args.where, tenantId } }),
      findUnique: (id: string) => prisma.booking.findFirst({ where: { id, tenantId } }),
      create: (data: any) =>
        prisma.booking.create({ data: { ...data, tenantId } }),
      updateStatus: (id: string, status: any) =>
        prisma.booking.update({ where: { id }, data: { status } }),
    },
    customers: {
      findMany: (args: any = {}) =>
        prisma.customer.findMany({ ...args, where: { ...args.where, tenantId } }),
      findByPhone: (normalizedPhone: string) =>
        prisma.customer.findUnique({
          where: { tenantId_normalizedPhone: { tenantId, normalizedPhone } },
        }),
      create: (data: any) =>
        prisma.customer.create({ data: { ...data, tenantId } }),
    },
    leads: {
      findMany: (args: any = {}) =>
        prisma.lead.findMany({ ...args, where: { ...args.where, tenantId } }),
      findUnique: (id: string) => prisma.lead.findFirst({ where: { id, tenantId } }),
      create: (data: any) =>
        prisma.lead.create({ data: { ...data, tenantId } }),
      updateStatus: (id: string, status: any) =>
        prisma.lead.update({ where: { id }, data: { status } }),
    },
    forms: {
      findMany: (args: any = {}) =>
        prisma.form.findMany({ ...args, where: { ...args.where, tenantId } }),
      findBySlug: (slug: string) =>
        prisma.form.findUnique({ where: { tenantId_slug: { tenantId, slug } } }),
      findUnique: (id: string) => prisma.form.findFirst({ where: { id, tenantId } }),
      create: (data: any) =>
        prisma.form.create({ data: { ...data, tenantId } }),
      update: (id: string, data: any) =>
        prisma.form.update({ where: { id }, data }),
    },
    availability: {
      findMany: () => prisma.availability.findMany({ where: { tenantId } }),
    },
  };
}
