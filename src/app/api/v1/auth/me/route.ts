import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      businessUsers: {
        include: {
          tenant: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const tenant = user.businessUsers[0]?.tenant || null;

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
    business: tenant,
  });
}

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("clientflow_token");
  return NextResponse.json({ success: true });
}
