import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { findOrCreateCustomer } from "@/lib/engine/customer";

export async function GET(req: Request) {
  try {
    const session = await requireTenant();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const quotes = await prisma.quote.findMany({
      where: {
        tenantId: session.tenantId,
        ...(status && status !== "ALL" ? { status: status as any } : {}),
      },
      include: {
        customer: true,
        service: true,
        items: true,
        payments: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ quotes });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load quotes" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireTenant();
    const body = await req.json();

    const {
      customerId,
      customerName,
      customerPhone,
      customerEmail,
      serviceId,
      validUntil,
      notes,
      items = [],
    } = body;

    const tenantId = session.tenantId;

    let resolvedCustomerId = customerId;
    if (!resolvedCustomerId) {
      if (!customerName || !customerPhone) {
        return NextResponse.json(
          { error: "Customer name and phone are required" },
          { status: 400 }
        );
      }
      const customer = await findOrCreateCustomer({
        tenantId,
        name: customerName,
        phone: customerPhone,
        email: customerEmail,
      });
      resolvedCustomerId = customer.id;
    }

    const quoteCount = await prisma.quote.count({ where: { tenantId } });
    const quoteNumber = `Q-${1000 + quoteCount + 1}`;

    const computedItems = Array.isArray(items)
      ? items.map((it: any) => {
          const qty = Math.max(1, Number(it.quantity) || 1);
          const unitPrice = Math.max(0, Number(it.unitPrice) || 0);
          return {
            tenantId,
            description: String(it.description || "Service Item"),
            quantity: qty,
            unitPrice,
            amount: qty * unitPrice,
          };
        })
      : [];

    const totalAmount = computedItems.reduce((sum, it) => sum + it.amount, 0);

    const quote = await prisma.quote.create({
      data: {
        tenantId,
        quoteNumber,
        customerId: resolvedCustomerId,
        ...(serviceId ? { serviceId } : {}),
        status: "SENT",
        totalAmount,
        validUntil: validUntil ? new Date(validUntil) : null,
        notes: notes || null,
        items: {
          create: computedItems,
        },
      },
      include: {
        customer: true,
        items: true,
        payments: true,
      },
    });

    return NextResponse.json({ success: true, quote });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create quote" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireTenant();
    const body = await req.json();
    const { quoteId, status, payment } = body;

    if (!quoteId) {
      return NextResponse.json({ error: "quoteId is required" }, { status: 400 });
    }

    const existing = await prisma.quote.findFirst({
      where: { id: quoteId, tenantId: session.tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    // If recording a payment (bKash, Nagad, Cash, etc.)
    if (payment && payment.amount) {
      await prisma.payment.create({
        data: {
          tenantId: session.tenantId,
          quoteId: existing.id,
          customerId: existing.customerId,
          amount: Number(payment.amount),
          provider: payment.provider || "BKASH",
          transactionId: payment.transactionId || null,
          status: "PAID",
        },
      });
    }

    const updated = await prisma.quote.update({
      where: { id: quoteId },
      data: {
        ...(status ? { status: status as any } : {}),
      },
      include: {
        customer: true,
        items: true,
        payments: true,
      },
    });

    return NextResponse.json({ success: true, quote: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update quote" },
      { status: 500 }
    );
  }
}
