import { NextResponse } from "next/server";
import { sendPasswordResetEmail } from "@/lib/supabase";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user exists in database
    const user = await prisma.user.findFirst({
      where: { email: cleanEmail },
    });

    if (!user) {
      // Return success even if not found to prevent user enumeration
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, a password reset link has been dispatched.",
      });
    }

    try {
      await sendPasswordResetEmail(cleanEmail);
    } catch (supaErr) {
      console.warn("Supabase sendPasswordResetEmail fallback:", supaErr);
    }

    return NextResponse.json({
      success: true,
      message: `Password reset instructions have been sent to ${cleanEmail}. Check your inbox or spam folder.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to process password reset request" },
      { status: 500 }
    );
  }
}
