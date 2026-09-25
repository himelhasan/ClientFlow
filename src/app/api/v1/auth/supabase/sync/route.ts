import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { normalizeBdPhone } from "@/lib/utils/bangladesh";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      supabaseId,
      email,
      name,
      avatarUrl,
      role = "BUSINESS_OWNER",
      phone,
      businessName,
      branchId,
    } = body;

    if (!email && !supabaseId) {
      return NextResponse.json(
        { error: "Email or Supabase ID is required" },
        { status: 400 }
      );
    }

    const cleanEmail = email ? email.toLowerCase().trim() : null;
    const normalized = phone ? normalizeBdPhone(phone) : null;

    // 1. Find or create User in Prisma DB
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(supabaseId ? [{ supabaseId }] : []),
          ...(cleanEmail ? [{ email: cleanEmail }] : []),
        ],
      },
      include: {
        businessUsers: {
          include: { tenant: true, branch: true },
        },
      },
    });

    if (user) {
      if (user.role !== role || (supabaseId && !(user as any).supabaseId)) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            role: role as any,
            ...(supabaseId && !(user as any).supabaseId ? { supabaseId } : {}),
            ...(avatarUrl && !(user as any).avatarUrl ? { avatarUrl } : {}),
            emailVerified: true,
          } as any,
          include: {
            businessUsers: {
              include: { tenant: true, branch: true },
            },
          },
        });
      }
    } else {
      let safePhone = phone || null;
      let safeNorm = normalized;

      if (safeNorm) {
        const existingPhoneUser = await prisma.user.findFirst({
          where: {
            OR: [
              { normalizedPhone: safeNorm },
              { phone: safePhone || safeNorm },
            ],
          },
        });
        if (existingPhoneUser) {
          safePhone = null;
          safeNorm = null;
        }
      }

      user = await prisma.user.create({
        data: {
          supabaseId: supabaseId || null,
          email: cleanEmail,
          name: name || (cleanEmail ? cleanEmail.split("@")[0] : "New User"),
          avatarUrl: avatarUrl || null,
          phone: safePhone,
          normalizedPhone: safeNorm,
          role: role as any,
          emailVerified: true,
          passwordHash: "SUPABASE_AUTH_MANAGED",
        } as any,
        include: {
          businessUsers: {
            include: { tenant: true, branch: true },
          },
        },
      });
    }

    // 2. Ensure Business Tenant association based on Role
    let primaryTenant: any = user.businessUsers[0]?.tenant;
    let assignedBranch = user.businessUsers[0]?.branch;

    if (!primaryTenant) {
      if (role === "SUPER_ADMIN" || role === "ADMIN") {
        // Find existing business or create default Platform Operations tenant
        primaryTenant = await prisma.business.findFirst();
        if (!primaryTenant) {
          primaryTenant = await prisma.business.create({
            data: {
              name: "ClientFlow HQ",
              slug: "clientflow-hq",
              phone: "01700000000",
              normalizedPhone: "+8801700000000",
              subscriptionPlan: "Enterprise",
            },
          });
        }
      } else if (role === "CUSTOMER") {
        // Link to first active business
        primaryTenant = await prisma.business.findFirst();
        if (!primaryTenant) {
          primaryTenant = await prisma.business.create({
            data: {
              name: "Glamour Studio",
              slug: "glamour-studio",
              phone: "01711223344",
              normalizedPhone: "+8801711223344",
              subscriptionPlan: "Growth",
            },
          });
        }
      } else {
        // BUSINESS_OWNER or STAFF: link to existing or create
        primaryTenant = await prisma.business.findFirst({
          where: {
            users: { some: { userId: user.id } },
          },
        });

        if (!primaryTenant) {
          primaryTenant = await prisma.business.findFirst();
        }

        if (!primaryTenant) {
          const bName = businessName || `${user.name}'s Studio`;
          const baseSlug = bName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
          const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

          primaryTenant = await prisma.business.create({
            data: {
              name: bName,
              slug,
              category: "Health & Beauty",
              phone: user.phone || "01711003300",
              normalizedPhone: user.normalizedPhone || "+8801711003300",
              email: user.email || undefined,
              subscriptionPlan: "Starter",
            },
          });

          const mainBranch = await prisma.branch.create({
            data: {
              tenantId: primaryTenant.id,
              name: `${primaryTenant.name} (HQ)`,
              isMain: true,
              status: "ACTIVE",
            },
          });
          assignedBranch = mainBranch;
        }
      }

      if (primaryTenant) {
        await prisma.businessUser.upsert({
          where: {
            tenantId_userId: {
              tenantId: primaryTenant.id,
              userId: user.id,
            },
          },
          update: {
            role: user.role,
          },
          create: {
            tenantId: primaryTenant.id,
            userId: user.id,
            role: user.role,
            branchId: branchId || assignedBranch?.id || null,
          },
        }).catch(() => {});
      }
    }

    // Ensure Customer CRM record exists for CUSTOMER role
    if (role === "CUSTOMER" && primaryTenant) {
      const custPhone = user.phone || "01711005500";
      const custNorm = user.normalizedPhone || "+8801711005500";
      await prisma.customer.upsert({
        where: {
          tenantId_normalizedPhone: {
            tenantId: primaryTenant.id,
            normalizedPhone: custNorm,
          },
        },
        update: {
          name: user.name,
          email: user.email || undefined,
        },
        create: {
          tenantId: primaryTenant.id,
          name: user.name,
          phone: custPhone,
          normalizedPhone: custNorm,
          email: user.email || undefined,
        },
      }).catch(() => {});
    }

    // 3. Issue Unified Session JWT Cookie
    const token = signToken({
      userId: user.id,
      email: user.email,
      phone: user.normalizedPhone || user.phone,
      role: user.role,
      tenantId: primaryTenant?.id,
      businessName: primaryTenant?.name,
    });

    const cookieStore = await cookies();
    cookieStore.set("clientflow_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: (user as any).avatarUrl,
        supabaseId: (user as any).supabaseId,
      },
      business: primaryTenant
        ? {
            id: primaryTenant.id,
            name: primaryTenant.name,
            slug: primaryTenant.slug,
          }
        : null,
      branch: assignedBranch
        ? {
            id: assignedBranch.id,
            name: assignedBranch.name,
          }
        : null,
    });
  } catch (error: any) {
    console.error("Supabase sync error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to synchronize Supabase user" },
      { status: 500 }
    );
  }
}
