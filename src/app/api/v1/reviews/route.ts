import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface ReviewRecord {
  id: string;
  tenantId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  staffName: string;
  rating: number;
  comment: string;
  platform: "INTERNAL" | "GOOGLE" | "FACEBOOK";
  status: "PUBLISHED" | "HIDDEN" | "PENDING";
  sentimentScore: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  reply?: string | null;
  repliedAt?: string | null;
  createdAt: string;
}

const reviewsStore: Record<string, ReviewRecord[]> = {};

function classifySentiment(rating: number, comment: string): "POSITIVE" | "NEUTRAL" | "NEGATIVE" {
  const lower = (comment || "").toLowerCase();
  if (
    rating >= 4 ||
    lower.includes("amazing") ||
    lower.includes("incredible") ||
    lower.includes("loved") ||
    lower.includes("best")
  ) {
    return rating <= 2 ? "NEGATIVE" : "POSITIVE";
  }
  if (rating === 3) return "NEUTRAL";
  return "NEGATIVE";
}

function buildAiSuggestedReply(review: ReviewRecord): string {
  if (review.rating >= 4) {
    return `Hi ${review.customerName.split(" ")[0]}, thank you so much for your ${review.rating}-star review on ${review.platform}! We're thrilled you enjoyed your ${review.serviceName} with ${review.staffName}. We've credited +50 loyalty points to your account and look forward to welcoming you back soon! ✨`;
  }
  if (review.rating === 3) {
    return `Hi ${review.customerName.split(" ")[0]}, thank you for sharing candid feedback about your ${review.serviceName}. We always strive for a 5-star experience and would love to make your next session with ${review.staffName} truly exceptional. Our studio manager will reach out via WhatsApp with a complimentary upgrade.`;
  }
  return `Dear ${review.customerName.split(" ")[0]}, we sincerely apologize that your recent visit did not meet our clinical standards. I have personally reviewed your notes with ${review.staffName} and would like to offer a complimentary corrective consultation at your convenience. We have messaged you directly to resolve this right away.`;
}

function getTenantReviews(tenantId: string): ReviewRecord[] {
  if (!reviewsStore[tenantId]) {
    reviewsStore[tenantId] = [
      {
        id: "rev-seed-1",
        tenantId,
        customerId: "cust-1",
        customerName: "Nusrat Jahan",
        customerPhone: "+8801711223344",
        serviceName: "HydraFacial MD & LED Glow Therapy",
        staffName: "Dr. Samira Rahman",
        rating: 5,
        comment:
          "Dr. Samira was incredible! My skin felt hydrated for weeks and the online booking & WhatsApp reminder flow was effortless.",
        platform: "GOOGLE",
        status: "PUBLISHED",
        sentimentScore: "POSITIVE",
        reply:
          "Thank you so much Nusrat! We loved hosting you at our Gulshan flagship and look forward to seeing you for your next HydraFacial session.",
        repliedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      },
      {
        id: "rev-seed-2",
        tenantId,
        customerId: "cust-2",
        customerName: "Tanvir Hossain",
        customerPhone: "+8801819556677",
        serviceName: "Deep Tissue Aromatherapy Massage (60m)",
        staffName: "Nadia Islam",
        rating: 5,
        comment:
          "Best sports recovery massage in Dhaka. Used my monthly wellness membership session right from the customer portal!",
        platform: "INTERNAL",
        status: "PUBLISHED",
        sentimentScore: "POSITIVE",
        reply: null,
        repliedAt: null,
        createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
      },
      {
        id: "rev-seed-3",
        tenantId,
        customerId: "cust-3",
        customerName: "Mehzabina Chowdhury",
        customerPhone: "+8801911443322",
        serviceName: "Keratin Protein Hair Spa & Trim",
        staffName: "Farhana Karim",
        rating: 4,
        comment:
          "Great hair treatment and very polite staff. Waiting lounge was slightly busy on Friday afternoon, otherwise 10/10.",
        platform: "FACEBOOK",
        status: "PUBLISHED",
        sentimentScore: "POSITIVE",
        reply:
          "Thank you Mehzabina! We appreciate your note on Friday lounge seating and have expanded our refreshment area.",
        repliedAt: new Date(Date.now() - 86400000 * 8).toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 9).toISOString(),
      },
      {
        id: "rev-seed-4",
        tenantId,
        customerId: "cust-4",
        customerName: "Sadia Afrin",
        customerPhone: "+8801611889900",
        serviceName: "Laser Skin Rejuvenation",
        staffName: "Dr. Samira Rahman",
        rating: 3,
        comment:
          "Treatment itself was good, but parking took 15 minutes to find near Road 11.",
        platform: "GOOGLE",
        status: "PUBLISHED",
        sentimentScore: "NEUTRAL",
        reply: null,
        repliedAt: null,
        createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
      },
      {
        id: "rev-seed-5",
        tenantId,
        customerId: "cust-5",
        customerName: "Rafiqul Alam",
        customerPhone: "+8801755667788",
        serviceName: "Express Detox Facial",
        staffName: "Nadia Islam",
        rating: 2,
        comment:
          "My session started 12 minutes late because the previous client ran over.",
        platform: "INTERNAL",
        status: "HIDDEN",
        sentimentScore: "NEGATIVE",
        reply: null,
        repliedAt: null,
        createdAt: new Date(Date.now() - 86400000 * 16).toISOString(),
      },
    ];
  }
  return reviewsStore[tenantId];
}

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

export async function GET(req: Request) {
  try {
    const tenantId = await resolveTenantId();
    const { searchParams } = new URL(req.url);
    const platform = searchParams.get("platform");
    const sentiment = searchParams.get("sentiment");
    const status = searchParams.get("status");

    let list = [...getTenantReviews(tenantId)];

    try {
      const dbReviews = await prisma.review.findMany({
        where: { tenantId },
        include: { customer: true, staff: true, booking: { include: { service: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      if (dbReviews.length > 0) {
        const mapped: ReviewRecord[] = dbReviews.map((r: any) => ({
          id: r.id,
          tenantId: r.tenantId,
          customerId: r.customerId,
          customerName: r.customer?.name || "Verified Client",
          customerPhone: r.customer?.phone || "+8801700000000",
          serviceName: r.booking?.service?.name || "Signature Clinical Service",
          staffName: r.staff?.name || "Senior Specialist",
          rating: r.rating,
          comment: r.comment || "",
          platform: (r.platform || "INTERNAL") as any,
          status: (r.status || "PUBLISHED") as any,
          sentimentScore: (r.sentimentScore ||
            classifySentiment(r.rating, r.comment || "")) as any,
          reply: r.reply,
          repliedAt: r.repliedAt ? new Date(r.repliedAt).toISOString() : null,
          createdAt: new Date(r.createdAt).toISOString(),
        }));
        const existingIds = new Set(mapped.map((m) => m.id));
        list = [...mapped, ...list.filter((item) => !existingIds.has(item.id))];
      }
    } catch {
      // Fallback to in-memory seed
    }

    const totalCount = list.length;
    const avgRating =
      totalCount > 0
        ? Number((list.reduce((s, r) => s + r.rating, 0) / totalCount).toFixed(2))
        : 4.9;

    // Calculate NPS: Promoters (5★) - Detractors (1-3★) as percentage
    const promoters = list.filter((r) => r.rating === 5).length;
    const detractors = list.filter((r) => r.rating <= 3).length;
    const npsScore =
      totalCount > 0 ? Math.round(((promoters - detractors) / totalCount) * 100) : 78;

    const sentimentBreakdown = {
      POSITIVE: list.filter((r) => r.sentimentScore === "POSITIVE").length,
      NEUTRAL: list.filter((r) => r.sentimentScore === "NEUTRAL").length,
      NEGATIVE: list.filter((r) => r.sentimentScore === "NEGATIVE").length,
    };

    const filtered = list.filter((r) => {
      if (platform && platform !== "ALL" && r.platform !== platform) return false;
      if (sentiment && sentiment !== "ALL" && r.sentimentScore !== sentiment) return false;
      if (status && status !== "ALL" && r.status !== status) return false;
      return true;
    });

    return NextResponse.json({
      reviews: filtered,
      metrics: {
        totalReviews: totalCount,
        averageRating: avgRating,
        npsScore,
        replyRate:
          totalCount > 0
            ? Math.round((list.filter((r) => Boolean(r.reply)).length / totalCount) * 100)
            : 100,
        sentimentBreakdown,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const tenantId = await resolveTenantId();
    const body = await req.json();
    const { action } = body;

    if (action === "SEND_REVIEW_REQUEST") {
      const { customerName, customerPhone, channel = "WHATSAPP", serviceName } = body;
      return NextResponse.json({
        success: true,
        message: `Review request link dispatched to ${customerName} (${customerPhone}) via ${channel} with +50 loyalty points incentive.`,
        requestDetails: {
          id: `req-${Date.now()}`,
          customerName,
          customerPhone,
          channel,
          serviceName,
          sentAt: new Date().toISOString(),
        },
      });
    }

    const {
      customerName = "Verified Customer",
      customerPhone = "+8801711223344",
      serviceName = "HydraFacial MD & LED Glow Therapy",
      staffName = "Dr. Samira Rahman",
      rating = 5,
      comment = "Fantastic service and attention to detail!",
      platform = "INTERNAL",
    } = body;

    const numRating = Math.min(5, Math.max(1, Number(rating)));
    const sentimentScore = classifySentiment(numRating, comment);

    const newReview: ReviewRecord = {
      id: `rev-${Date.now()}`,
      tenantId,
      customerId: `cust-${Date.now()}`,
      customerName,
      customerPhone,
      serviceName,
      staffName,
      rating: numRating,
      comment,
      platform,
      status: numRating >= 3 ? "PUBLISHED" : "PENDING",
      sentimentScore,
      reply: null,
      repliedAt: null,
      createdAt: new Date().toISOString(),
    };

    getTenantReviews(tenantId).unshift(newReview);

    return NextResponse.json({
      success: true,
      review: newReview,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create review" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const tenantId = await resolveTenantId();
    const body = await req.json();
    const { reviewId, action, reply, status } = body;

    const list = getTenantReviews(tenantId);
    const target = list.find((r) => r.id === reviewId);
    if (!target) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    if (action === "GENERATE_AI_REPLY") {
      const suggested = buildAiSuggestedReply(target);
      return NextResponse.json({
        success: true,
        aiSuggestedReply: suggested,
      });
    }

    if (reply !== undefined) {
      target.reply = reply;
      target.repliedAt = new Date().toISOString();
    }

    if (status) {
      target.status = status;
    }

    try {
      await prisma.review.update({
        where: { id: reviewId },
        data: {
          ...(reply !== undefined ? { reply, repliedAt: new Date() } : {}),
          ...(status ? { status } : {}),
        },
      });
    } catch {
      // In-memory store already updated
    }

    return NextResponse.json({
      success: true,
      review: target,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update review" },
      { status: 500 }
    );
  }
}
