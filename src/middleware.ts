import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// In-memory sliding window rate limiter for Edge Runtime
const ipRequestCounts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = ipRequestCounts.get(ip);

  if (!record || now > record.resetAt) {
    ipRequestCounts.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count += 1;
  return true;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";

  // 1. Rate-limit authentication endpoints (25 req / minute per IP)
  if (pathname.startsWith("/api/v1/auth/")) {
    const allowed = checkRateLimit(`auth:${ip}`, 25, 60_000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many authentication attempts. Please wait 1 minute." },
        { status: 429 }
      );
    }
  }

  // 2. Rate-limit public widget submission endpoints (60 req / minute per IP)
  if (pathname.startsWith("/api/v1/widget/")) {
    const allowed = checkRateLimit(`widget:${ip}`, 60, 60_000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again shortly." },
        { status: 429 }
      );
    }
  }

  const res = NextResponse.next();

  // 3. Apply OWASP Security Headers (Section 61)
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-XSS-Protection", "1; mode=block");

  // Allow /f/[formId] to be embedded in external customer websites via widget.js,
  // while protecting /dashboard/* and /api/* from clickjacking
  if (!pathname.startsWith("/f/")) {
    res.headers.set("X-Frame-Options", "SAMEORIGIN");
  }

  return res;
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/v1/:path*", "/f/:path*"],
};
