import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, signToken } from "@/lib/auth";
import { normalizeBdPhone, isValidBdPhone } from "@/lib/utils/bangladesh";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, password, businessName, businessCategory } = body;

    if (!name || !password || !businessName || (!email && !phone)) {
      return NextResponse.json(
        { error: "Name, password, business name, and email or phone are required" },
        { status: 400 }
      );
    }

    const normalizedPhone = phone ? normalizeBdPhone(phone) : null;
    if (phone && !isValidBdPhone(phone)) {
      return NextResponse.json(
        { error: "Please enter a valid 11-digit Bangladeshi mobile number (01XXXXXXXXX)" },
        { status: 400 }
      );
    }

    // Check existing user
    if (email) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
      }
    }

    if (normalizedPhone) {
      const existingUserPhone = await prisma.user.findFirst({
        where: { normalizedPhone },
      });
      if (existingUserPhone) {
        return NextResponse.json({ error: "User with this phone number already exists" }, { status: 400 });
      }
    }

    const passwordHash = await hashPassword(password);
    const slug = businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") + "-" + Math.random().toString(36).substring(2, 6);

    // Create Business Tenant + Owner User + BusinessUser link in single transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email: email || null,
          phone: phone || null,
          normalizedPhone,
          passwordHash,
          role: "BUSINESS_OWNER",
        },
      });

      const business = await tx.business.create({
        data: {
          name: businessName,
          slug,
          category: businessCategory || "Other",
          phone: phone || "01700000000",
          normalizedPhone: normalizedPhone || "+8801700000000",
          email: email || null,
          // Default Starter plan quotas (Section 68)
          subscriptionPlan: "Starter",
          leadQuota: 50,
          leadsUsed: 0,
          whatsappQuota: 150,
          whatsappUsed: 0,
          smsQuota: 100,
          smsUsed: 0,
          emailQuota: 150,
          emailUsed: 0,
        },
      });

      await tx.businessUser.create({
        data: {
          tenantId: business.id,
          userId: user.id,
          role: "BUSINESS_OWNER",
        },
      });

      // Initialize default business availability (Mon-Thu 09:00-18:00, Fri 09:00-15:00)
      const defaultSchedules = [
        { dayOfWeek: 0, startTime: "09:00", endTime: "18:00", isWorkingDay: true }, // Sun
        { dayOfWeek: 1, startTime: "09:00", endTime: "18:00", isWorkingDay: true }, // Mon
        { dayOfWeek: 2, startTime: "09:00", endTime: "18:00", isWorkingDay: true }, // Tue
        { dayOfWeek: 3, startTime: "09:00", endTime: "18:00", isWorkingDay: true }, // Wed
        { dayOfWeek: 4, startTime: "09:00", endTime: "18:00", isWorkingDay: true }, // Thu
        { dayOfWeek: 5, startTime: "09:00", endTime: "15:00", isWorkingDay: true, breakStart: "12:30", breakEnd: "14:00" }, // Fri with prayer break
        { dayOfWeek: 6, startTime: "09:00", endTime: "18:00", isWorkingDay: false }, // Sat closed
      ];

      for (const sched of defaultSchedules) {
        await tx.availability.create({
          data: {
            tenantId: business.id,
            dayOfWeek: sched.dayOfWeek,
            startTime: sched.startTime,
            endTime: sched.endTime,
            isWorkingDay: sched.isWorkingDay,
            breakStart: sched.breakStart,
            breakEnd: sched.breakEnd,
          },
        });
      }

      return { user, business };
    });

    const token = signToken({
      userId: result.user.id,
      email: result.user.email,
      phone: result.user.normalizedPhone,
      role: result.user.role,
      tenantId: result.business.id,
      businessName: result.business.name,
    });

    cookies().set("clientflow_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return NextResponse.json({
      success: true,
      user: { id: result.user.id, name: result.user.name, email: result.user.email },
      business: { id: result.business.id, name: result.business.name, slug: result.business.slug },
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: error.message || "Registration failed" }, { status: 500 });
  }
}
