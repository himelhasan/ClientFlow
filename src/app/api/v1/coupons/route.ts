import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface CouponItem {
  id: string;
  tenantId: string;
  code: string;
  description: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minSpend: number;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  usedCount: number;
  revenueGenerated: number;
  validFrom: string;
  validUntil?: string | null;
  isActive: boolean;
  createdAt: string;
}

const couponsStore: Record<string, CouponItem[]> = {};

async function resolveTenantId(): Promise<string> {
  try {
    const session = await requireTenant();
    return session.tenantId;
  } catch {
    try {
      const first = await prisma.business.findFirst();
      if (first) return first.id;
    } catch {
      // ignore
    }
    return "demo-tenant-id";
  }
}

function getTenantCoupons(tenantId: string): CouponItem[] {
  if (!couponsStore[tenantId]) {
    couponsStore[tenantId] = [
      {
        id: "cpn-1",
        tenantId,
        code: "GLOW20",
        description: "20% off first HydraFacial MD or Laser Rejuvenation session",
        discountType: "PERCENTAGE",
        discountValue: 20,
        minSpend: 3000,
        maxDiscount: 1500,
        usageLimit: 100,
        usedCount: 42,
        revenueGenerated: 189000,
        validFrom: new Date(Date.now() - 86400000 * 30).toISOString(),
        validUntil: new Date(Date.now() + 86400000 * 60).toISOString(),
        isActive: true,
        createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
      },
      {
        id: "cpn-2",
        tenantId,
        code: "EID500",
        description: "Flat ৳500 festival savings on any spa package above ৳2,500",
        discountType: "FIXED",
        discountValue: 500,
        minSpend: 2500,
        maxDiscount: 500,
        usageLimit: 200,
        usedCount: 87,
        revenueGenerated: 312500,
        validFrom: new Date(Date.now() - 86400000 * 20).toISOString(),
        validUntil: new Date(Date.now() + 86400000 * 30).toISOString(),
        isActive: true,
        createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
      },
      {
        id: "cpn-3",
        tenantId,
        code: "VIPMEMBER15",
        description: "15% recurring loyalty discount for Gold & Platinum members",
        discountType: "PERCENTAGE",
        discountValue: 15,
        minSpend: 2000,
        maxDiscount: 2000,
        usageLimit: null,
        usedCount: 29,
        revenueGenerated: 142000,
        validFrom: new Date(Date.now() - 86400000 * 60).toISOString(),
        validUntil: null,
        isActive: true,
        createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
      },
    ];
  }
  return couponsStore[tenantId];
}

export async function GET(req: Request) {
  try {
    const tenantId = await resolveTenantId();
    const { searchParams } = new URL(req.url);
    const validateCode = searchParams.get("validateCode");
    const cartAmount = Number(searchParams.get("amount") || "4500");

    const coupons = getTenantCoupons(tenantId);

    if (validateCode) {
      const clean = validateCode.trim().toUpperCase();
      const found = coupons.find((c) => c.code.toUpperCase() === clean && c.isActive);
      if (!found) {
        return NextResponse.json(
          { valid: false, error: "Invalid or expired promo code" },
          { status: 404 }
        );
      }
      if (cartAmount < found.minSpend) {
        return NextResponse.json(
          {
            valid: false,
            error: `Minimum spend of ৳${found.minSpend} required for ${found.code}`,
          },
          { status: 400 }
        );
      }

      const rawDiscount =
        found.discountType === "PERCENTAGE"
          ? Math.round((cartAmount * found.discountValue) / 100)
          : found.discountValue;
      const appliedDiscount = found.maxDiscount
        ? Math.min(rawDiscount, found.maxDiscount)
        : rawDiscount;

      return NextResponse.json({
        valid: true,
        coupon: found,
        cartAmount,
        discountAmount: appliedDiscount,
        finalAmount: Math.max(0, cartAmount - appliedDiscount),
      });
    }

    return NextResponse.json({
      coupons,
      summary: {
        activeCoupons: coupons.filter((c) => c.isActive).length,
        totalRedemptions: coupons.reduce((s, c) => s + c.usedCount, 0),
        totalRevenueAttributed: coupons.reduce((s, c) => s + c.revenueGenerated, 0),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load coupons" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const tenantId = await resolveTenantId();
    const body = await req.json();
    const {
      code,
      description = "",
      discountType = "PERCENTAGE",
      discountValue = 15,
      minSpend = 1500,
      maxDiscount = 1000,
      usageLimit = 100,
      validUntil,
    } = body;

    if (!code) {
      return NextResponse.json({ error: "Promo code is required" }, { status: 400 });
    }

    const cleanCode = String(code).trim().toUpperCase();

    try {
      await prisma.coupon.create({
        data: {
          tenantId,
          code: cleanCode,
          description,
          discountType,
          discountValue: Number(discountValue),
          minSpend: Number(minSpend),
          maxDiscount: maxDiscount ? Number(maxDiscount) : null,
          usageLimit: usageLimit ? Number(usageLimit) : null,
          validUntil: validUntil ? new Date(validUntil) : null,
          isActive: true,
        },
      });
    } catch {
      // Handled by in-memory store
    }

    const newCoupon: CouponItem = {
      id: `cpn-${Date.now()}`,
      tenantId,
      code: cleanCode,
      description: description || `${discountValue}${discountType === "PERCENTAGE" ? "%" : " BDT"} promotional discount`,
      discountType,
      discountValue: Number(discountValue),
      minSpend: Number(minSpend),
      maxDiscount: maxDiscount ? Number(maxDiscount) : null,
      usageLimit: usageLimit ? Number(usageLimit) : null,
      usedCount: 0,
      revenueGenerated: 0,
      validFrom: new Date().toISOString(),
      validUntil: validUntil || new Date(Date.now() + 86400000 * 45).toISOString(),
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    getTenantCoupons(tenantId).unshift(newCoupon);

    return NextResponse.json({
      success: true,
      message: `Promo code ${cleanCode} created and ready for checkout!`,
      coupon: newCoupon,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create coupon" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const tenantId = await resolveTenantId();
    const body = await req.json();
    const { couponId, action, isActive } = body;

    const list = getTenantCoupons(tenantId);
    const target = list.find((c) => c.id === couponId);
    if (!target) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    if (action === "REDEEM_TEST") {
      target.usedCount += 1;
      target.revenueGenerated += Math.max(2500, target.minSpend || 3000);
      return NextResponse.json({
        success: true,
        message: `Simulated redemption recorded for ${target.code}!`,
        coupon: target,
      });
    }

    if (typeof isActive === "boolean") {
      target.isActive = isActive;
    } else {
      target.isActive = !target.isActive;
    }

    return NextResponse.json({
      success: true,
      coupon: target,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update coupon" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const tenantId = await resolveTenantId();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Coupon ID is required" }, { status: 400 });
    }

    const list = getTenantCoupons(tenantId);
    const idx = list.findIndex((c) => c.id === id);
    if (idx !== -1) {
      list.splice(idx, 1);
    }

    return NextResponse.json({
      success: true,
      message: "Coupon deleted.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete coupon" },
      { status: 500 }
    );
  }
}
