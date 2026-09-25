import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "./db";
import { UserRole } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "clientflow-jwt-super-secret-key";
const AUTH_COOKIE = "clientflow_token";

export interface SessionPayload {
  userId: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  tenantId?: string;
  businessName?: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch (err) {
    return null;
  }
}

/**
 * Retrieves the current authenticated session from cookies
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Requires a session or throws an unauthorized response
 */
export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

/**
 * Requires session with an active tenant association
 */
export async function requireTenant(): Promise<SessionPayload & { tenantId: string }> {
  const session = await requireAuth();
  if (!session.tenantId) {
    // If user is owner or staff, look up their primary tenant
    const bu = await prisma.businessUser.findFirst({
      where: { userId: session.userId },
      include: { tenant: true },
    });
    if (bu) {
      session.tenantId = bu.tenantId;
      session.businessName = bu.tenant.name;
      return session as SessionPayload & { tenantId: string };
    }
    throw new Error("NO_TENANT_FOUND");
  }
  return session as SessionPayload & { tenantId: string };
}
