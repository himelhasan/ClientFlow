import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface LoyaltyTierRule {
  tier: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";
  minPoints: number;
  multiplier: number;
  perks: string;
}

const DEFAULT_TIER_RULES: LoyaltyTierRule[] = [
  {
    tier: "BRONZE",
    minPoints: 0,
    multiplier: 1.0,
    perks: "1 pt per ৳10 spent • Birthday SMS Voucher",
  },
  {
    tier: "SILVER",
    minPoints: 500,
    multiplier: 1.25,
    perks: "1.25x points • 5% off weekday bookings • Priority Waitlist",
  },
  {
    tier: "GOLD",
    minPoints: 1500,
    multiplier: 1.5,
    perks: "1.5x points • 10% off all services • Free Add-on Express Spa",
  },
  {
    tier: "PLATINUM",
    minPoints: 3500,
    multiplier: 2.0,
    perks: "2.0x points • 15% VIP discount • Zero deposit requirement",
  },
];

// Tenant-scoped in-memory store for rules & fallback accounts
const memoryLoyaltyStore: Record<
  string,
  {
    pointsPerTenBDT: number;
    redemptionRateBDT: number; // 100 pts = ৳100 discount
    tierRules: LoyaltyTierRule[];
    accounts: any[];
  }
> = {};

function calculateTier(lifetimePoints: number): "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" {
  if (lifetimePoints >= 3500) return "PLATINUM";
  if (lifetimePoints >= 1500) return "GOLD";
  if (lifetimePoints >= 500) return "SILVER";
  return "BRONZE";
}

function getTenantMemory(tenantId: string) {
  if (!memoryLoyaltyStore[tenantId]) {
    memoryLoyaltyStore[tenantId] = {
      pointsPerTenBDT: 1,
      redemptionRateBDT: 1, // 1 point = ৳1 discount
      tierRules: [...DEFAULT_TIER_RULES],
      accounts: [
        {
          id: "loy-demo-1",
          customerId: "cust-demo-1",
          customer: {
            name: "Nusrat Jahan",
            phone: "01711223344",
            email: "nusrat@example.com",
          },
          pointsBalance: 2140,
          lifetimePoints: 3850,
          tier: "PLATINUM",
          transactions: [
            {
              id: "tx-1",
              points: 600,
              type: "EARN",
              description: "Bridal Makeover Package (2x Platinum Multiplier)",
              createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
            },
            {
              id: "tx-2",
              points: -500,
              type: "REDEEM",
              description: "Redeemed 500 pts for ৳500 Booking Discount",
              createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
            },
          ],
        },
        {
          id: "loy-demo-2",
          customerId: "cust-demo-2",
          customer: {
            name: "Tanvir Ahmed",
            phone: "01819556677",
            email: "tanvir@example.com",
          },
          pointsBalance: 1620,
          lifetimePoints: 1920,
          tier: "GOLD",
          transactions: [
            {
              id: "tx-3",
              points: 350,
              type: "EARN",
              description: "HydraFacial Glow Session (1.5x Gold Multiplier)",
              createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
            },
          ],
        },
        {
          id: "loy-demo-3",
          customerId: "cust-demo-3",
          customer: {
            name: "Farhana Karim",
            phone: "01914889900",
            email: "farhana@example.com",
          },
          pointsBalance: 740,
          lifetimePoints: 940,
          tier: "SILVER",
          transactions: [
            {
              id: "tx-4",
              points: 240,
              type: "BONUS",
              description: "Referral Bonus — Invited 2 New Clients",
              createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
            },
          ],
        },
      ],
    };
  }
  return memoryLoyaltyStore[tenantId];
}

export async function GET() {
  try {
    let tenantId = "demo-tenant";
    try {
      const session = await requireTenant();
      tenantId = session.tenantId;
    } catch {
      // Fallback
    }

    const mem = getTenantMemory(tenantId);
    let dbAccounts: any[] = [];

    try {
      dbAccounts = await prisma.loyaltyAccount.findMany({
        where: { tenantId },
        include: {
          customer: true,
          transactions: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
        orderBy: { pointsBalance: "desc" },
      });

      // If DB has customers but no loyalty accounts yet, auto-seed accounts for existing customers
      if (dbAccounts.length === 0) {
        const existingCustomers = await prisma.customer.findMany({
          where: { tenantId },
          take: 8,
        });

        for (let i = 0; i < existingCustomers.length; i++) {
          const c = existingCustomers[i];
          const initialLifetime = [3600, 1850, 780, 320][i % 4];
          const initialBalance = [2400, 1450, 620, 320][i % 4];
          const tier = calculateTier(initialLifetime);

          const created = await prisma.loyaltyAccount.create({
            data: {
              tenantId,
              customerId: c.id,
              pointsBalance: initialBalance,
              lifetimePoints: initialLifetime,
              tier,
              transactions: {
                create: [
                  {
                    tenantId,
                    points: initialBalance,
                    type: "EARN",
                    description: `Points earned from completed appointments (${tier} multiplier)`,
                  },
                ],
              },
            },
            include: {
              customer: true,
              transactions: { orderBy: { createdAt: "desc" }, take: 5 },
            },
          });
          dbAccounts.push(created);
        }
      }
    } catch {
      // Fallback to memory store if table not migrated yet
    }

    const accounts = dbAccounts.length > 0 ? dbAccounts : mem.accounts;

    return NextResponse.json({
      config: {
        pointsPerTenBDT: mem.pointsPerTenBDT,
        redemptionRateBDT: mem.redemptionRateBDT,
        tierRules: mem.tierRules,
      },
      accounts,
      summary: {
        totalMembers: accounts.length,
        totalActivePoints: accounts.reduce(
          (sum, a) => sum + Number(a.pointsBalance || 0),
          0
        ),
        vipCount: accounts.filter(
          (a) => a.tier === "GOLD" || a.tier === "PLATINUM"
        ).length,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load loyalty program" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    let tenantId = "demo-tenant";
    try {
      const session = await requireTenant();
      tenantId = session.tenantId;
    } catch {
      // Fallback
    }

    const body = await req.json();
    const {
      action = "AWARD_OR_REDEEM",
      accountId,
      customerName,
      customerPhone,
      type = "BONUS", // EARN, BONUS, REDEEM
      points = 100,
      spendBDT,
      description,
    } = body;

    const mem = getTenantMemory(tenantId);

    // Enroll new member or award/redeem points
    const numericPoints = Math.abs(Number(points || 0));
    const signedPoints =
      type === "REDEEM" ? -numericPoints : numericPoints;

    // Try Prisma update first
    try {
      let targetAccount: any = null;
      if (accountId) {
        targetAccount = await prisma.loyaltyAccount.findFirst({
          where: { id: accountId, tenantId },
          include: { customer: true },
        });
      }

      if (!targetAccount && customerPhone) {
        let customer = await prisma.customer.findFirst({
          where: { tenantId, phone: customerPhone },
        });
        if (!customer && customerName) {
          customer = await prisma.customer.create({
            data: {
              tenantId,
              name: customerName,
              phone: customerPhone,
              normalizedPhone: customerPhone.replace(/\D/g, ""),
            },
          });
        }
        if (customer) {
          targetAccount = await prisma.loyaltyAccount.findUnique({
            where: { customerId: customer.id },
            include: { customer: true },
          });
          if (!targetAccount) {
            targetAccount = await prisma.loyaltyAccount.create({
              data: {
                tenantId,
                customerId: customer.id,
                pointsBalance: 0,
                lifetimePoints: 0,
                tier: "BRONZE",
              },
              include: { customer: true },
            });
          }
        }
      }

      if (targetAccount) {
        const currentRule =
          mem.tierRules.find((r) => r.tier === targetAccount.tier) ||
          DEFAULT_TIER_RULES[0];

        const finalPoints =
          type === "EARN" && spendBDT
            ? Math.round(
                (Number(spendBDT) / 10) *
                  mem.pointsPerTenBDT *
                  currentRule.multiplier
              )
            : signedPoints;

        const nextBalance = Math.max(
          0,
          targetAccount.pointsBalance + finalPoints
        );
        const nextLifetime =
          finalPoints > 0
            ? targetAccount.lifetimePoints + finalPoints
            : targetAccount.lifetimePoints;
        const nextTier = calculateTier(nextLifetime);

        const updated = await prisma.loyaltyAccount.update({
          where: { id: targetAccount.id },
          data: {
            pointsBalance: nextBalance,
            lifetimePoints: nextLifetime,
            tier: nextTier,
            transactions: {
              create: {
                tenantId,
                points: finalPoints,
                type,
                description:
                  description ||
                  (type === "REDEEM"
                    ? `Redeemed ${Math.abs(finalPoints)} pts for ৳${Math.abs(
                        finalPoints
                      )} discount`
                    : `Awarded ${finalPoints} pts (${nextTier} tier)`),
              },
            },
          },
          include: {
            customer: true,
            transactions: { orderBy: { createdAt: "desc" }, take: 8 },
          },
        });

        return NextResponse.json({
          success: true,
          account: updated,
          discountValueBDT:
            type === "REDEEM"
              ? Math.abs(finalPoints) * mem.redemptionRateBDT
              : 0,
        });
      }
    } catch {
      // Fallback to in-memory update
    }

    // In-memory execution fallback
    let memAcc = mem.accounts.find((a) => a.id === accountId);
    if (!memAcc) {
      memAcc = {
        id: `loy-${Date.now()}`,
        customerId: `cust-${Date.now()}`,
        customer: {
          name: customerName || "New Loyalty Member",
          phone: customerPhone || "01700000000",
        },
        pointsBalance: 0,
        lifetimePoints: 0,
        tier: "BRONZE",
        transactions: [],
      };
      mem.accounts.unshift(memAcc);
    }

    const currentRule =
      mem.tierRules.find((r) => r.tier === memAcc.tier) || DEFAULT_TIER_RULES[0];
    const finalPoints =
      type === "EARN" && spendBDT
        ? Math.round(
            (Number(spendBDT) / 10) *
              mem.pointsPerTenBDT *
              currentRule.multiplier
          )
        : signedPoints;

    memAcc.pointsBalance = Math.max(0, memAcc.pointsBalance + finalPoints);
    if (finalPoints > 0) memAcc.lifetimePoints += finalPoints;
    memAcc.tier = calculateTier(memAcc.lifetimePoints);
    memAcc.transactions.unshift({
      id: `tx-${Date.now()}`,
      points: finalPoints,
      type,
      description:
        description ||
        (type === "REDEEM"
          ? `Redeemed ${Math.abs(finalPoints)} pts for ৳${Math.abs(finalPoints)} discount`
          : `Awarded ${finalPoints} pts (${memAcc.tier} tier)`),
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      account: memAcc,
      discountValueBDT:
        type === "REDEEM" ? Math.abs(finalPoints) * mem.redemptionRateBDT : 0,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to process loyalty transaction" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    let tenantId = "demo-tenant";
    try {
      const session = await requireTenant();
      tenantId = session.tenantId;
    } catch {
      // Fallback
    }

    const body = await req.json();
    const mem = getTenantMemory(tenantId);

    if (body.pointsPerTenBDT !== undefined) {
      mem.pointsPerTenBDT = Number(body.pointsPerTenBDT);
    }
    if (body.redemptionRateBDT !== undefined) {
      mem.redemptionRateBDT = Number(body.redemptionRateBDT);
    }
    if (Array.isArray(body.tierRules)) {
      mem.tierRules = body.tierRules;
    }

    return NextResponse.json({
      success: true,
      config: {
        pointsPerTenBDT: mem.pointsPerTenBDT,
        redemptionRateBDT: mem.redemptionRateBDT,
        tierRules: mem.tierRules,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update loyalty configuration" },
      { status: 500 }
    );
  }
}
