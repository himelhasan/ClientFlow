import { prisma } from "../db";
import { normalizeBdPhone } from "../utils/bangladesh";

export interface MatchCustomerParams {
  tenantId: string;
  name: string;
  phone: string;
  email?: string;
  whatsapp?: string;
  address?: string;
  city?: string;
}

/**
 * Finds an existing customer by normalized Bangladeshi phone number within the tenant,
 * or creates a new customer record. Ensures zero duplicate profiles per tenant.
 */
export async function findOrCreateCustomer(params: MatchCustomerParams) {
  const { tenantId, name, phone, email, whatsapp, address, city } = params;
  const normalizedPhone = normalizeBdPhone(phone);

  if (!normalizedPhone) {
    throw new Error("Valid customer phone number is required");
  }

  // 1. Look up existing customer for this tenant
  let customer = await prisma.customer.findUnique({
    where: {
      tenantId_normalizedPhone: {
        tenantId,
        normalizedPhone,
      },
    },
  });

  if (customer) {
    // Optionally update missing details like email or address
    const updates: any = {};
    if (!customer.email && email) updates.email = email;
    if (!customer.whatsapp && whatsapp) updates.whatsapp = normalizeBdPhone(whatsapp);
    if (!customer.address && address) updates.address = address;
    if (!customer.city && city) updates.city = city;

    if (Object.keys(updates).length > 0) {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: updates,
      });
    }

    return customer;
  }

  // 2. Create new customer
  customer = await prisma.customer.create({
    data: {
      tenantId,
      name,
      phone,
      normalizedPhone,
      whatsapp: whatsapp ? normalizeBdPhone(whatsapp) : null,
      email: email || null,
      address: address || null,
      city: city || null,
    },
  });

  return customer;
}

/**
 * Updates customer metrics after a booking status change (Completed, Cancelled, etc.)
 */
export async function updateCustomerMetrics(customerId: string) {
  const [completed, cancelled, total, revenue] = await Promise.all([
    prisma.booking.count({ where: { customerId, status: "COMPLETED" } }),
    prisma.booking.count({ where: { customerId, status: "CANCELLED" } }),
    prisma.booking.count({ where: { customerId } }),
    prisma.booking.aggregate({
      where: { customerId, status: "COMPLETED" },
      _sum: { price: true },
    }),
  ]);

  await prisma.customer.update({
    where: { id: customerId },
    data: {
      completedBookings: completed,
      cancelledBookings: cancelled,
      totalBookings: total,
      totalRevenue: revenue._sum.price || 0,
    },
  });
}
