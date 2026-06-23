import { NextRequest } from "next/server";
import crypto from "crypto";

const CSRF_SECRET = process.env.CSRF_SECRET || process.env.JWT_SECRET || "fallback-secret";
const CSRF_HEADER = "x-csrf-token";
const CSRF_COOKIE = "csrf-token";

export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return crypto.createHmac("sha256", CSRF_SECRET).update(token).digest("hex");
}

export function verifyCSRFToken(request: NextRequest): boolean {
  const token = request.headers.get(CSRF_HEADER);
  const cookie = request.cookies.get(CSRF_COOKIE)?.value;

  if (!token || !cookie) return false;
  
  const expectedHash = hashToken(cookie);
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedHash));
}

export function shouldCheckCSRF(request: NextRequest): boolean {
  const method = request.method.toUpperCase();
  return ["POST", "PUT", "PATCH", "DELETE"].includes(method) && !request.nextUrl.pathname.startsWith("/api/auth/login");
}
