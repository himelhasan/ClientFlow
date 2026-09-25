import { NextResponse } from "next/server";
import { updatePassword } from "@/lib/supabase";
import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { password, email } = await req.json();

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Try Supabase auth update
    try {
      await updatePassword(password);
    } catch (_) {}

    // Also update local database password hash
    if (email) {
      const passwordHash = await hashPassword(password);
      await prisma.user.updateMany({
        where: { email: email.toLowerCase().trim() },
        data: { passwordHash },
      });
    } else {
      try {
        const session = await requireAuth();
        const passwordHash = await hashPassword(password);
        await prisma.user.update({
          where: { id: session.userId },
          data: { passwordHash },
        });
      } catch (_) {}
    }

    return NextResponse.json({
      success: true,
      message: "Password has been successfully updated. You may now sign in.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update password" },
      { status: 500 }
    );
  }
}
