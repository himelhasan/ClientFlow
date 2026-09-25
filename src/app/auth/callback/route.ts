import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/dashboard";

  if (code) {
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data, error } = await supabaseAdmin.auth.exchangeCodeForSession(code);

      if (!error && data?.user) {
        const supaUser = data.user;
        const email = supaUser.email?.toLowerCase().trim();
        const name =
          supaUser.user_metadata?.full_name ||
          supaUser.user_metadata?.name ||
          (email ? email.split("@")[0] : "Google User");
        const avatarUrl = supaUser.user_metadata?.avatar_url;

        let user = await prisma.user.findFirst({
          where: {
            OR: [
              { supabaseId: supaUser.id },
              ...(email ? [{ email }] : []),
            ],
          },
          include: {
            businessUsers: {
              include: { tenant: true },
            },
          },
        });

        if (!user) {
          // Create business owner user + tenant
          const slug =
            name.toLowerCase().replace(/[^a-z0-9]+/g, "-") +
            "-" +
            Math.random().toString(36).substring(2, 6);

          user = await prisma.user.create({
            data: {
              supabaseId: supaUser.id,
              email: email || null,
              name,
              avatarUrl,
              role: "BUSINESS_OWNER",
              emailVerified: true,
              passwordHash: "SUPABASE_OAUTH",
            },
            include: {
              businessUsers: {
                include: { tenant: true },
              },
            },
          });

          const business = await prisma.business.create({
            data: {
              name: `${name}'s Business`,
              slug,
              category: "Other",
              phone: "01700000000",
              normalizedPhone: "+8801700000000",
              email: email || undefined,
            },
          });

          await prisma.businessUser.create({
            data: {
              tenantId: business.id,
              userId: user.id,
              role: "BUSINESS_OWNER",
            },
          });

          user = (await prisma.user.findUnique({
            where: { id: user.id },
            include: { businessUsers: { include: { tenant: true } } },
          }))!;
        } else if (!(user as any).supabaseId) {
          await prisma.user.update({
            where: { id: user.id },
            data: { supabaseId: supaUser.id, emailVerified: true } as any,
          });
        }

        const primaryTenant = user.businessUsers[0]?.tenant;
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
          maxAge: 60 * 60 * 24 * 7,
          path: "/",
        });

        return NextResponse.redirect(new URL(next, requestUrl.origin));
      }
    } catch (err) {
      console.error("Auth callback error:", err);
    }
  }

  return NextResponse.redirect(new URL("/dashboard", requestUrl.origin));
}
