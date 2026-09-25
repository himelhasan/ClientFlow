import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface PackagePlanItem {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  type: "PACKAGE" | "MEMBERSHIP";
  price: number;
  billingInterval: "ONE_TIME" | "MONTHLY" | "QUARTERLY" | "YEARLY";
  totalSessions: number;
  validityDays: number;
  isActive: boolean;
  activeSubscribers: number;
  totalRevenue: number;
  createdAt: string;
}

interface EnrollmentItem {
  id: string;
  tenantId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  packagePlanId: string;
  packageName: string;
  type: "PACKAGE" | "MEMBERSHIP";
  totalSessions: number;
  remainingSessions: number;
  status: "ACTIVE" | "EXHAUSTED" | "EXPIRED" | "CANCELLED";
  expiresAt: string;
  createdAt: string;
}

const plansStore: Record<string, PackagePlanItem[]> = {};
const enrollmentsStore: Record<string, EnrollmentItem[]> = {};

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

function getTenantPlans(tenantId: string): PackagePlanItem[] {
  if (!plansStore[tenantId]) {
    plansStore[tenantId] = [
      {
        id: "pkg-plan-1",
        tenantId,
        name: "Glow 5-Session HydraFacial Bundle",
        description: "Buy 4 clinical HydraFacials and get the 5th complimentary. Valid for 90 days.",
        type: "PACKAGE",
        price: 19500,
        billingInterval: "ONE_TIME",
        totalSessions: 5,
        validityDays: 90,
        isActive: true,
        activeSubscribers: 18,
        totalRevenue: 351000,
        createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
      },
      {
        id: "pkg-plan-2",
        tenantId,
        name: "VIP Monthly Wellness & Recovery Club",
        description: "4 Deep Tissue or Aromatherapy sessions every month + 15% off retail skincare.",
        type: "MEMBERSHIP",
        price: 9800,
        billingInterval: "MONTHLY",
        totalSessions: 4,
        validityDays: 30,
        isActive: true,
        activeSubscribers: 34,
        totalRevenue: 333200,
        createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
      },
      {
        id: "pkg-plan-3",
        tenantId,
        name: "Bridal 8-Session RadianceTransformation",
        description: "Complete 60-day pre-bridal laser toning, hair spa, and glow peel package.",
        type: "PACKAGE",
        price: 34000,
        billingInterval: "ONE_TIME",
        totalSessions: 8,
        validityDays: 120,
        isActive: true,
        activeSubscribers: 9,
        totalRevenue: 306000,
        createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
      },
    ];
  }
  return plansStore[tenantId];
}

function getTenantEnrollments(tenantId: string): EnrollmentItem[] {
  if (!enrollmentsStore[tenantId]) {
    enrollmentsStore[tenantId] = [
      {
        id: "enr-1",
        tenantId,
        customerId: "cust-1",
        customerName: "Nusrat Jahan",
        customerPhone: "+8801711223344",
        packagePlanId: "pkg-plan-1",
        packageName: "Glow 5-Session HydraFacial Bundle",
        type: "PACKAGE",
        totalSessions: 5,
        remainingSessions: 3,
        status: "ACTIVE",
        expiresAt: new Date(Date.now() + 86400000 * 75).toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
      },
      {
        id: "enr-2",
        tenantId,
        customerId: "cust-2",
        customerName: "Tanvir Hossain",
        customerPhone: "+8801819556677",
        packagePlanId: "pkg-plan-2",
        packageName: "VIP Monthly Wellness & Recovery Club",
        type: "MEMBERSHIP",
        totalSessions: 4,
        remainingSessions: 2,
        status: "ACTIVE",
        expiresAt: new Date(Date.now() + 86400000 * 22).toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
      },
      {
        id: "enr-3",
        tenantId,
        customerId: "cust-3",
        customerName: "Mehzabina Chowdhury",
        customerPhone: "+8801911443322",
        packagePlanId: "pkg-plan-3",
        packageName: "Bridal 8-Session RadianceTransformation",
        type: "PACKAGE",
        totalSessions: 8,
        remainingSessions: 6,
        status: "ACTIVE",
        expiresAt: new Date(Date.now() + 86400000 * 105).toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
      },
    ];
  }
  return enrollmentsStore[tenantId];
}

export async function GET() {
  try {
    const tenantId = await resolveTenantId();
    const plans = getTenantPlans(tenantId);
    const enrollments = getTenantEnrollments(tenantId);

    const mrr = plans
      .filter((p) => p.type === "MEMBERSHIP" && p.isActive)
      .reduce((sum, p) => sum + p.price * p.activeSubscribers, 0);

    const totalRemainingSessions = enrollments
      .filter((e) => e.status === "ACTIVE")
      .reduce((sum, e) => sum + e.remainingSessions, 0);

    return NextResponse.json({
      plans,
      enrollments,
      summary: {
        activePlans: plans.filter((p) => p.isActive).length,
        activeEnrollments: enrollments.filter((e) => e.status === "ACTIVE").length,
        monthlyRecurringRevenue: mrr,
        totalRemainingSessions,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load packages" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const tenantId = await resolveTenantId();
    const body = await req.json();
    const { action } = body;

    // Enroll a customer into a Package or Membership
    if (action === "ENROLL_CUSTOMER") {
      const { customerName, customerPhone, packagePlanId } = body;
      const plans = getTenantPlans(tenantId);
      const plan = plans.find((p) => p.id === packagePlanId) || plans[0];

      const newEnrollment: EnrollmentItem = {
        id: `enr-${Date.now()}`,
        tenantId,
        customerId: `cust-${Date.now()}`,
        customerName: customerName || "New VIP Client",
        customerPhone: customerPhone || "+8801711223344",
        packagePlanId: plan.id,
        packageName: plan.name,
        type: plan.type,
        totalSessions: plan.totalSessions,
        remainingSessions: plan.totalSessions,
        status: "ACTIVE",
        expiresAt: new Date(Date.now() + 86400000 * plan.validityDays).toISOString(),
        createdAt: new Date().toISOString(),
      };

      getTenantEnrollments(tenantId).unshift(newEnrollment);
      plan.activeSubscribers += 1;
      plan.totalRevenue += plan.price;

      return NextResponse.json({
        success: true,
        message: `${newEnrollment.customerName} enrolled in ${plan.name} (${plan.totalSessions} sessions credited).`,
        enrollment: newEnrollment,
      });
    }

    // Create a new PackagePlan or Membership
    const {
      name,
      description = "",
      type = "PACKAGE",
      price = 15000,
      billingInterval = type === "MEMBERSHIP" ? "MONTHLY" : "ONE_TIME",
      totalSessions = 5,
      validityDays = 90,
    } = body;

    if (!name) {
      return NextResponse.json({ error: "Package name is required" }, { status: 400 });
    }

    try {
      await prisma.packagePlan.create({
        data: {
          tenantId,
          name,
          description,
          type,
          price: Number(price),
          billingInterval,
          totalSessions: Number(totalSessions),
          validityDays: Number(validityDays),
          isActive: true,
        },
      });
    } catch {
      // Fallback in-memory handled below
    }

    const created: PackagePlanItem = {
      id: `pkg-plan-${Date.now()}`,
      tenantId,
      name,
      description,
      type,
      price: Number(price),
      billingInterval,
      totalSessions: Number(totalSessions),
      validityDays: Number(validityDays),
      isActive: true,
      activeSubscribers: 1,
      totalRevenue: Number(price),
      createdAt: new Date().toISOString(),
    };

    getTenantPlans(tenantId).unshift(created);

    return NextResponse.json({
      success: true,
      message: `${type === "MEMBERSHIP" ? "Recurring Membership" : "Prepaid Package"} "${name}" created.`,
      plan: created,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create package" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const tenantId = await resolveTenantId();
    const body = await req.json();
    const { action, enrollmentId, planId } = body;

    if (action === "REDEEM_SESSION") {
      const enrollments = getTenantEnrollments(tenantId);
      const target = enrollments.find((e) => e.id === enrollmentId);
      if (!target) {
        return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
      }
      if (target.remainingSessions <= 0) {
        return NextResponse.json(
          { error: "No remaining sessions in this package" },
          { status: 400 }
        );
      }

      target.remainingSessions -= 1;
      if (target.remainingSessions === 0) {
        target.status = "EXHAUSTED";
      }

      return NextResponse.json({
        success: true,
        message: `1 session redeemed for ${target.customerName}. ${target.remainingSessions} of ${target.totalSessions} sessions remaining.`,
        enrollment: target,
      });
    }

    if (action === "TOGGLE_PLAN" && planId) {
      const plans = getTenantPlans(tenantId);
      const plan = plans.find((p) => p.id === planId);
      if (plan) {
        plan.isActive = !plan.isActive;
      }
      return NextResponse.json({
        success: true,
        plan,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update package" },
      { status: 500 }
    );
  }
}
