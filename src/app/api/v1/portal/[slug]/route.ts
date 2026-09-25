import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface InMemoryPortalState {
  upcomingBookings: any[];
  pastBookings: any[];
  packages: any[];
  loyalty: {
    pointsBalance: number;
    lifetimePoints: number;
    tier: string;
    nextTier: string;
    pointsToNextTier: number;
    transactions: any[];
  };
  giftCards: any[];
  reviews: any[];
  communicationPrefs: {
    whatsappOptIn: boolean;
    smsOptIn: boolean;
    emailOptIn: boolean;
    marketingOptIn: boolean;
    reminderLeadHours: number;
  };
}

const portalStore: Record<string, InMemoryPortalState> = {};

function getFallbackPortalState(slug: string, phone: string): InMemoryPortalState {
  const key = `${slug}:${phone || "demo"}`;
  if (!portalStore[key]) {
    const tomorrow = new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0];
    const nextWeek = new Date(Date.now() + 86400000 * 6).toISOString().split("T")[0];
    const lastMonth = new Date(Date.now() - 86400000 * 14).toISOString().split("T")[0];
    const twoMonthsAgo = new Date(Date.now() - 86400000 * 35).toISOString().split("T")[0];

    portalStore[key] = {
      upcomingBookings: [
        {
          id: "bk-up-101",
          bookingNumber: "#1084",
          serviceId: "srv-1",
          serviceName: "HydraFacial MD & LED Glow Therapy",
          staffName: "Dr. Samira Rahman",
          branchName: "Gulshan Flagship",
          date: tomorrow,
          startTime: "11:00 AM",
          endTime: "12:00 PM",
          status: "CONFIRMED",
          price: 4500,
          depositPaid: 1125,
          hoursUntilAppointment: 48,
          cancellationFee: 0,
          refundableDeposit: 1125,
          notes: "Prefer fragrance-free serum",
        },
        {
          id: "bk-up-102",
          bookingNumber: "#1091",
          serviceId: "srv-2",
          serviceName: "Deep Tissue Aromatherapy Massage (60m)",
          staffName: "Nadia Islam",
          branchName: "Gulshan Flagship",
          date: nextWeek,
          startTime: "03:00 PM",
          endTime: "04:00 PM",
          status: "PENDING",
          price: 3200,
          depositPaid: 800,
          hoursUntilAppointment: 144,
          cancellationFee: 0,
          refundableDeposit: 800,
          notes: "Using 1 session from Wellness Membership",
        },
      ],
      pastBookings: [
        {
          id: "bk-past-092",
          bookingNumber: "#1042",
          serviceId: "srv-1",
          serviceName: "HydraFacial MD & LED Glow Therapy",
          staffName: "Dr. Samira Rahman",
          branchName: "Gulshan Flagship",
          date: lastMonth,
          startTime: "02:00 PM",
          endTime: "03:00 PM",
          status: "COMPLETED",
          price: 4500,
          depositPaid: 1125,
          hasReviewed: true,
        },
        {
          id: "bk-past-081",
          bookingNumber: "#1019",
          serviceId: "srv-3",
          serviceName: "Keratin Protein Hair Spa & Trim",
          staffName: "Farhana Karim",
          branchName: "Banani Studio",
          date: twoMonthsAgo,
          startTime: "04:00 PM",
          endTime: "05:30 PM",
          status: "COMPLETED",
          price: 3800,
          depositPaid: 950,
          hasReviewed: false,
        },
      ],
      packages: [
        {
          id: "cp-1",
          packagePlanId: "pkg-1",
          name: "Glow 5-Session HydraFacial Bundle",
          type: "PACKAGE",
          totalSessions: 5,
          remainingSessions: 3,
          price: 19500,
          status: "ACTIVE",
          expiresAt: new Date(Date.now() + 86400000 * 75).toISOString(),
          billingInterval: "ONE_TIME",
        },
        {
          id: "cp-2",
          packagePlanId: "pkg-2",
          name: "VIP Monthly Wellness Membership",
          type: "MEMBERSHIP",
          totalSessions: 4,
          remainingSessions: 2,
          price: 9800,
          status: "ACTIVE",
          expiresAt: new Date(Date.now() + 86400000 * 22).toISOString(),
          billingInterval: "MONTHLY",
        },
      ],
      loyalty: {
        pointsBalance: 1450,
        lifetimePoints: 3200,
        tier: "GOLD",
        nextTier: "PLATINUM",
        pointsToNextTier: 550,
        transactions: [
          {
            id: "lt-1",
            points: 450,
            type: "EARN",
            description: "Completed Booking #1042 — HydraFacial MD",
            createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
          },
          {
            id: "lt-2",
            points: 100,
            type: "BONUS",
            description: "5-Star Verified Review Bonus",
            createdAt: new Date(Date.now() - 86400000 * 13).toISOString(),
          },
          {
            id: "lt-3",
            points: -500,
            type: "REDEEM",
            description: "Redeemed ৳500 Discount Voucher on Package",
            createdAt: new Date(Date.now() - 86400000 * 25).toISOString(),
          },
        ],
      },
      giftCards: [
        {
          id: "gc-1",
          code: "GIFT-AURA-2026",
          initialValue: 5000,
          currentBalance: 3250,
          purchaserName: "Tariq Ahmed",
          recipientName: "Nusrat Jahan",
          message: "Happy Anniversary! Enjoy a relaxing spa day ✨",
          status: "ACTIVE",
          expiresAt: new Date(Date.now() + 86400000 * 180).toISOString(),
        },
      ],
      reviews: [
        {
          id: "rev-101",
          rating: 5,
          comment: "Dr. Samira was incredible! My skin felt hydrated for weeks and the studio ambiance is unmatched.",
          serviceName: "HydraFacial MD & LED Glow Therapy",
          staffName: "Dr. Samira Rahman",
          platform: "INTERNAL",
          status: "PUBLISHED",
          reply: "Thank you so much Nusrat! We loved hosting you and look forward to seeing you for your next session.",
          createdAt: new Date(Date.now() - 86400000 * 13).toISOString(),
        },
      ],
      communicationPrefs: {
        whatsappOptIn: true,
        smsOptIn: true,
        emailOptIn: true,
        marketingOptIn: true,
        reminderLeadHours: 24,
      },
    };
  }
  return portalStore[key];
}

export async function GET(
  req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone") || "+8801711223344";

    let business: any = null;
    let dbServices: any[] = [];
    let dbStaff: any[] = [];

    try {
      business = await prisma.business.findFirst({
        where: slug === "demo" ? {} : { slug },
      });
      if (!business) {
        business = await prisma.business.findFirst();
      }
      if (business) {
        dbServices = await prisma.service.findMany({
          where: { tenantId: business.id, isActive: true },
          take: 12,
        });
        dbStaff = await prisma.staff.findMany({
          where: { tenantId: business.id, status: "ACTIVE" },
          take: 10,
        });
      }
    } catch {
      // Fallback if DB is not migrated or unreachable
    }

    const fallbackState = getFallbackPortalState(slug, phone);

    const resolvedBusiness = {
      id: business?.id || "demo-tenant-id",
      name: business?.name || "Aura Glow Studio & MedSpa",
      slug: business?.slug || slug || "aura-glow-medspa",
      category: business?.category || "Aesthetics & Wellness",
      description:
        business?.description ||
        "Premier clinical dermatology, bespoke facials, and restorative wellness therapies.",
      phone: business?.phone || "+880 1711-009988",
      whatsapp: business?.whatsapp || "+8801711009988",
      email: business?.email || "concierge@auraglow.studio",
      address: business?.address || "House 42, Road 11, Block F, Banani / Gulshan-2",
      city: business?.city || "Dhaka",
      currency: business?.currency || "BDT",
      cancellationPolicy: {
        freeCancelHours: 24,
        lateCancelFeePercent: 20,
        depositPercent: 25,
        policySummary:
          "Free rescheduling or full deposit refund up to 24 hours before appointment. Cancellations under 24 hours incur a 20% late fee.",
      },
    };

    const resolvedServices =
      dbServices.length > 0
        ? dbServices.map((s: any) => ({
            id: s.id,
            name: s.name,
            duration: s.duration || 60,
            price: Number(s.price || 3500),
            category: s.category || "Signature Treatments",
            depositPercent: 25,
          }))
        : [
            {
              id: "srv-1",
              name: "HydraFacial MD & LED Glow Therapy",
              duration: 60,
              price: 4500,
              category: "Clinical Facial",
              depositPercent: 25,
            },
            {
              id: "srv-2",
              name: "Deep Tissue Aromatherapy Massage (60m)",
              duration: 60,
              price: 3200,
              category: "Body & Wellness",
              depositPercent: 25,
            },
            {
              id: "srv-3",
              name: "Keratin Protein Hair Spa & Trim",
              duration: 90,
              price: 3800,
              category: "Hair Ritual",
              depositPercent: 25,
            },
            {
              id: "srv-4",
              name: "Laser Skin Rejuvenation & Brightening",
              duration: 45,
              price: 6500,
              category: "Laser Aesthetics",
              depositPercent: 25,
            },
          ];

    const resolvedStaff =
      dbStaff.length > 0
        ? dbStaff.map((st: any) => ({
            id: st.id,
            name: st.name,
            title: st.title || "Senior Specialist",
          }))
        : [
            { id: "st-1", name: "Dr. Samira Rahman", title: "Lead Aesthetic Physician" },
            { id: "st-2", name: "Nadia Islam", title: "Senior Holistic Therapist" },
            { id: "st-3", name: "Farhana Karim", title: "Master Hair & Scalp Specialist" },
          ];

    return NextResponse.json({
      business: resolvedBusiness,
      services: resolvedServices,
      staff: resolvedStaff,
      customer: {
        id: "cust-portal-1",
        name: "Nusrat Jahan",
        phone,
        email: "nusrat.jahan@example.com",
        memberSince: "Jan 2025",
        totalVisits: 14,
        totalSpent: 48500,
        communicationPrefs: fallbackState.communicationPrefs,
      },
      upcomingBookings: fallbackState.upcomingBookings,
      pastBookings: fallbackState.pastBookings,
      packages: fallbackState.packages,
      loyalty: fallbackState.loyalty,
      giftCards: fallbackState.giftCards,
      reviews: fallbackState.reviews,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load customer portal" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const body = await req.json();
    const { action, phone = "+8801711223344" } = body;
    const state = getFallbackPortalState(slug, phone);

    if (action === "BOOK") {
      const {
        serviceId,
        serviceName,
        staffName,
        date,
        startTime,
        price = 4500,
        usePackageId,
        notes,
      } = body;

      let depositPaid = Math.round(Number(price) * 0.25);
      let usedPackageName: string | null = null;

      if (usePackageId) {
        const pkg = state.packages.find((p) => p.id === usePackageId && p.remainingSessions > 0);
        if (pkg) {
          pkg.remainingSessions -= 1;
          if (pkg.remainingSessions === 0) pkg.status = "EXHAUSTED";
          depositPaid = 0;
          usedPackageName = pkg.name;
        }
      }

      const newBooking = {
        id: `bk-up-${Date.now().toString().slice(-4)}`,
        bookingNumber: `#${Math.floor(1100 + Math.random() * 899)}`,
        serviceId: serviceId || "srv-1",
        serviceName: serviceName || "HydraFacial MD & LED Glow Therapy",
        staffName: staffName || "Dr. Samira Rahman",
        branchName: "Gulshan Flagship",
        date,
        startTime,
        endTime: "1 Hour Session",
        status: "CONFIRMED",
        price: Number(price),
        depositPaid,
        hoursUntilAppointment: 72,
        cancellationFee: 0,
        refundableDeposit: depositPaid,
        notes: usedPackageName
          ? `Redeemed 1 session from ${usedPackageName}${notes ? ` · ${notes}` : ""}`
          : notes || "Booked via Customer Self-Serve Portal",
      };

      state.upcomingBookings.unshift(newBooking);

      // Award booking loyalty points
      const earnedPts = Math.round(Number(price) / 10);
      state.loyalty.pointsBalance += earnedPts;
      state.loyalty.lifetimePoints += earnedPts;
      state.loyalty.transactions.unshift({
        id: `lt-${Date.now()}`,
        points: earnedPts,
        type: "EARN",
        description: `Portal Booking ${newBooking.bookingNumber} — ${newBooking.serviceName}`,
        createdAt: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: usedPackageName
          ? `Appointment confirmed! 1 session deducted from ${usedPackageName}.`
          : `Appointment confirmed! Deposit of ৳${depositPaid} recorded and +${earnedPts} loyalty points added.`,
        booking: newBooking,
        packages: state.packages,
        loyalty: state.loyalty,
      });
    }

    if (action === "RESCHEDULE") {
      const { bookingId, newDate, newStartTime } = body;
      const target = state.upcomingBookings.find((b) => b.id === bookingId);
      if (!target) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }
      target.date = newDate;
      target.startTime = newStartTime;
      target.status = "RESCHEDULED";

      return NextResponse.json({
        success: true,
        message: `Appointment ${target.bookingNumber} rescheduled to ${newDate} at ${newStartTime} with zero fee.`,
        booking: target,
      });
    }

    if (action === "CANCEL") {
      const { bookingId, reason } = body;
      const idx = state.upcomingBookings.findIndex((b) => b.id === bookingId);
      if (idx === -1) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }
      const target = state.upcomingBookings[idx];

      // Calculate hours until appointment
      const apptTime = new Date(`${target.date}T10:00:00`).getTime();
      const hoursLeft = Math.max(0, Math.round((apptTime - Date.now()) / 3600000));
      const isLateCancel = hoursLeft < 24;
      const cancellationFee = isLateCancel ? Math.round(target.price * 0.2) : 0;
      const refundedDeposit = Math.max(0, target.depositPaid - cancellationFee);

      target.status = "CANCELLED";
      target.cancellationFee = cancellationFee;
      target.refundableDeposit = refundedDeposit;
      target.cancelReason = reason || "Cancelled by customer in portal";

      state.upcomingBookings.splice(idx, 1);
      state.pastBookings.unshift(target);

      return NextResponse.json({
        success: true,
        isLateCancel,
        cancellationFee,
        refundedDeposit,
        message: isLateCancel
          ? `Appointment cancelled (<24h notice). A late fee of ৳${cancellationFee} was applied; ৳${refundedDeposit} deposit refunded.`
          : `Appointment cancelled (>24h notice). Full deposit of ৳${refundedDeposit} is queued for refund.`,
        booking: target,
      });
    }

    if (action === "UPDATE_PREFERENCES") {
      const { preferences } = body;
      state.communicationPrefs = {
        ...state.communicationPrefs,
        ...preferences,
      };
      return NextResponse.json({
        success: true,
        message: "Communication preferences saved.",
        communicationPrefs: state.communicationPrefs,
      });
    }

    if (action === "SUBMIT_REVIEW") {
      const { rating = 5, comment, serviceName, staffName, bookingId } = body;
      const numRating = Math.min(5, Math.max(1, Number(rating)));
      const sentimentScore =
        numRating >= 4 ? "POSITIVE" : numRating === 3 ? "NEUTRAL" : "NEGATIVE";

      // Try saving to Prisma if possible
      try {
        const business = await prisma.business.findFirst({
          where: slug === "demo" ? {} : { slug },
        });
        const customer = business
          ? await prisma.customer.findFirst({ where: { tenantId: business.id } })
          : null;
        if (business && customer) {
          await prisma.review.create({
            data: {
              tenantId: business.id,
              customerId: customer.id,
              rating: numRating,
              comment: comment || "Great experience!",
              platform: "INTERNAL",
              status: "PUBLISHED",
              sentimentScore,
            },
          });
        }
      } catch {
        // Fallback in-memory handled below
      }

      const newReview = {
        id: `rev-${Date.now()}`,
        rating: numRating,
        comment: comment || "Wonderful service and very professional team!",
        serviceName: serviceName || "HydraFacial MD & LED Glow Therapy",
        staffName: staffName || "Dr. Samira Rahman",
        platform: "INTERNAL",
        status: "PUBLISHED",
        sentimentScore,
        createdAt: new Date().toISOString(),
      };

      state.reviews.unshift(newReview);
      if (bookingId) {
        const past = state.pastBookings.find((b) => b.id === bookingId);
        if (past) past.hasReviewed = true;
      }

      // Bonus 50 loyalty points for review
      state.loyalty.pointsBalance += 50;
      state.loyalty.lifetimePoints += 50;
      state.loyalty.transactions.unshift({
        id: `lt-rev-${Date.now()}`,
        points: 50,
        type: "BONUS",
        description: "Verified Customer Review Reward (+50 pts)",
        createdAt: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: "Thank you for your review! +50 bonus loyalty points added to your wallet.",
        review: newReview,
        loyalty: state.loyalty,
      });
    }

    return NextResponse.json({ error: "Unsupported portal action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to process portal request" },
      { status: 500 }
    );
  }
}
