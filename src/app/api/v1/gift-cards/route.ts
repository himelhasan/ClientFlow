import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";

const memoryGiftCards: Record<string, any[]> = {};

function generateGiftCardCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const seg = () =>
    Array.from({ length: 4 }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join("");
  return `GC-${seg()}-${seg()}`;
}

function getTenantGiftCards(tenantId: string) {
  if (!memoryGiftCards[tenantId]) {
    memoryGiftCards[tenantId] = [
      {
        id: "gc-demo-1",
        code: "GC-EID8-9942",
        initialValue: 5000,
        currentBalance: 3200,
        purchaserName: "Arefin Rahman",
        recipientName: "Sabrina Rahman",
        recipientPhone: "01711334455",
        recipientEmail: "sabrina@example.com",
        message: "Happy Anniversary! Enjoy a relaxing spa & makeover day 🌸",
        status: "ACTIVE",
        expiresAt: new Date(Date.now() + 86400000 * 120).toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
      },
      {
        id: "gc-demo-2",
        code: "GC-GLOW-2026",
        initialValue: 2500,
        currentBalance: 2500,
        purchaserName: "Zarin Tasnim",
        recipientName: "Maliha Khan",
        recipientPhone: "01819223344",
        recipientEmail: "maliha@example.com",
        message: "Birthday Treat at Premier Studio! ✨",
        status: "ACTIVE",
        expiresAt: new Date(Date.now() + 86400000 * 180).toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      },
      {
        id: "gc-demo-3",
        code: "GC-VIP9-1104",
        initialValue: 3000,
        currentBalance: 0,
        purchaserName: "Mahmudul Hasan",
        recipientName: "Samia Islam",
        recipientPhone: "01911667788",
        message: "Enjoy your HydraFacial session!",
        status: "REDEEMED",
        expiresAt: new Date(Date.now() + 86400000 * 60).toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 25).toISOString(),
      },
    ];
  }
  return memoryGiftCards[tenantId];
}

export async function GET(req: Request) {
  try {
    let tenantId = "demo-tenant";
    try {
      const session = await requireTenant();
      tenantId = session.tenantId;
    } catch {
      // Fallback
    }

    const { searchParams } = new URL(req.url);
    const codeQuery = searchParams.get("code")?.trim().toUpperCase();

    const memList = getTenantGiftCards(tenantId);
    let cards: any[] = [];

    try {
      const dbCards = await prisma.giftCard.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
      });

      if (dbCards.length > 0) {
        cards = dbCards.map((c) => ({
          ...c,
          initialValue: Number(c.initialValue),
          currentBalance: Number(c.currentBalance),
        }));
      }
    } catch {
      // Fallback to memory
    }

    if (cards.length === 0) {
      cards = memList;
    }

    if (codeQuery) {
      const found = cards.find((c) => c.code.toUpperCase() === codeQuery);
      return NextResponse.json({
        found: Boolean(found),
        giftCard: found || null,
      });
    }

    return NextResponse.json({
      giftCards: cards,
      summary: {
        totalIssued: cards.length,
        activeCount: cards.filter((c) => c.status === "ACTIVE").length,
        outstandingBalanceBDT: cards.reduce(
          (sum, c) => sum + Number(c.currentBalance || 0),
          0
        ),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load gift cards" },
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
    const initialValue = Math.max(100, Number(body.initialValue || 2000));
    const code = (body.code || generateGiftCardCode()).toUpperCase();
    const expiresAt = body.expiresAt
      ? new Date(body.expiresAt)
      : new Date(Date.now() + 86400000 * 180);

    let createdCard: any = null;

    try {
      const dbCard = await prisma.giftCard.create({
        data: {
          tenantId,
          code,
          initialValue,
          currentBalance: initialValue,
          purchaserName: body.purchaserName || "Walk-in Client",
          recipientName: body.recipientName || "Valued Guest",
          recipientPhone: body.recipientPhone || null,
          recipientEmail: body.recipientEmail || null,
          message:
            body.message ||
            "Enjoy a relaxing wellness & beauty session on us!",
          status: "ACTIVE",
          expiresAt,
        },
      });
      createdCard = {
        ...dbCard,
        initialValue: Number(dbCard.initialValue),
        currentBalance: Number(dbCard.currentBalance),
      };
    } catch {
      // Fallback to in-memory
    }

    if (!createdCard) {
      createdCard = {
        id: `gc-${Date.now()}`,
        code,
        initialValue,
        currentBalance: initialValue,
        purchaserName: body.purchaserName || "Walk-in Client",
        recipientName: body.recipientName || "Valued Guest",
        recipientPhone: body.recipientPhone || "01700000000",
        recipientEmail: body.recipientEmail || "",
        message:
          body.message || "Enjoy a relaxing wellness & beauty session on us!",
        status: "ACTIVE",
        expiresAt: expiresAt.toISOString(),
        createdAt: new Date().toISOString(),
      };
      getTenantGiftCards(tenantId).unshift(createdCard);
    }

    return NextResponse.json({
      success: true,
      giftCard: createdCard,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to issue digital gift card" },
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
    const code = String(body.code || "").trim().toUpperCase();
    const redeemAmount = Math.max(0, Number(body.redeemAmount || 0));

    if (!code || redeemAmount <= 0) {
      return NextResponse.json(
        { error: "Valid gift card code and redeemAmount > 0 are required" },
        { status: 400 }
      );
    }

    try {
      const existing = await prisma.giftCard.findFirst({
        where: { tenantId, code },
      });

      if (existing) {
        const curBal = Number(existing.currentBalance);
        if (curBal <= 0 || existing.status !== "ACTIVE") {
          return NextResponse.json(
            { error: "This gift card has no remaining balance or is inactive" },
            { status: 400 }
          );
        }

        const deducted = Math.min(curBal, redeemAmount);
        const nextBalance = curBal - deducted;
        const nextStatus = nextBalance <= 0 ? "REDEEMED" : "ACTIVE";

        const updated = await prisma.giftCard.update({
          where: { id: existing.id },
          data: {
            currentBalance: nextBalance,
            status: nextStatus,
          },
        });

        return NextResponse.json({
          success: true,
          deductedAmountBDT: deducted,
          remainingBalanceBDT: nextBalance,
          giftCard: {
            ...updated,
            initialValue: Number(updated.initialValue),
            currentBalance: Number(updated.currentBalance),
          },
        });
      }
    } catch {
      // Fallback to in-memory
    }

    const memCards = getTenantGiftCards(tenantId);
    const memCard = memCards.find((c) => c.code.toUpperCase() === code);
    if (!memCard) {
      return NextResponse.json(
        { error: `Gift Card ${code} not found` },
        { status: 404 }
      );
    }

    if (memCard.currentBalance <= 0) {
      return NextResponse.json(
        { error: "Gift card already fully redeemed" },
        { status: 400 }
      );
    }

    const deducted = Math.min(memCard.currentBalance, redeemAmount);
    memCard.currentBalance -= deducted;
    if (memCard.currentBalance <= 0) {
      memCard.status = "REDEEMED";
    }

    return NextResponse.json({
      success: true,
      deductedAmountBDT: deducted,
      remainingBalanceBDT: memCard.currentBalance,
      giftCard: memCard,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to redeem gift card" },
      { status: 500 }
    );
  }
}
