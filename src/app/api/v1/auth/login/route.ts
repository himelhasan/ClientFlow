import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, signToken } from "@/lib/auth";
import { normalizeBdPhone } from "@/lib/utils/bangladesh";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { identifier, password } = await req.json();

    if (!identifier || !password) {
      return NextResponse.json({ error: "Email or phone, and password are required" }, { status: 400 });
    }

    const normalized = normalizeBdPhone(identifier);

    // Find user by email or normalized phone
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase().trim() },
          { normalizedPhone: normalized },
          { phone: identifier.trim() },
        ],
      },
      include: {
        businessUsers: {
          include: {
            tenant: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const primaryTenant = user.businessUsers[0]?.tenant;

    const token = signToken({
      userId: user.id,
      email: user.email,
      phone: user.normalizedPhone,
      role: user.role,
      tenantId: primaryTenant?.id,
      businessName: primaryTenant?.name,
    });

    const cookieStore = await cookies();
    cookieStore.set("clientflow_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      business: primaryTenant
        ? { id: primaryTenant.id, name: primaryTenant.name, slug: primaryTenant.slug }
        : null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Login failed" }, { status: 500 });
  }
}
