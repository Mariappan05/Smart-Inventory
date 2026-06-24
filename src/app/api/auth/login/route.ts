import { NextRequest, NextResponse } from "next/server";
import { AuthController } from "@/controllers/authController";
import { authCookieName } from "@/lib/auth/session";
import { getRateLimitKey, checkRateLimit } from "@/lib/security/rateLimit";
import { auditLogger, AuditEventType } from "@/lib/security/audit";
import { getClientIP, recordFailedLogin, clearFailedLogins, blacklistIP } from "@/lib/security/ipFilter";

const GENERIC_AUTH_ERROR = "Invalid username or password";

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);

  try {
    // ── Rate limiting ──────────────────────────────────────────────────────
    const rateLimitKey = getRateLimitKey(request, "login");
    const rateLimit = checkRateLimit(rateLimitKey, "login");

    if (!rateLimit.allowed) {
      const retryAfter = rateLimit.blockedUntil
        ? Math.ceil((rateLimit.blockedUntil - Date.now()) / 1000)
        : Math.ceil((rateLimit.resetAt - Date.now()) / 1000);

      await auditLogger.log({
        eventType: AuditEventType.RATE_LIMIT_EXCEEDED,
        ipAddress: clientIP,
        resource: "auth/login",
        success: false,
        errorMessage: "Login rate limit exceeded",
      });

      return NextResponse.json(
        {
          success: false,
          message: rateLimit.blockedUntil
            ? `Too many failed login attempts. Please try again after ${Math.ceil(retryAfter / 60)} minutes.`
            : "Too many login attempts. Please try again later.",
          retryAfter,
        },
        {
          status: 429,
          headers: { "Retry-After": retryAfter.toString() },
        }
      );
    }

    // ── Parse body ─────────────────────────────────────────────────────────
    let body: { identifier?: string; password?: string; rememberMe?: boolean };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid request format" },
        { status: 400 }
      );
    }

    if (!body.identifier || !body.password) {
      return NextResponse.json(
        { success: false, message: "Username/Email and password are required" },
        { status: 400 }
      );
    }

    // ── JWT_SECRET guard ───────────────────────────────────────────────────
    if (!process.env.JWT_SECRET) {
      return NextResponse.json(
        { success: false, message: "Server configuration error. Please contact administrator." },
        { status: 500 }
      );
    }

    // ── Authenticate ───────────────────────────────────────────────────────
    const controller = new AuthController();
    try {
      const session = await controller.login({
        identifier: body.identifier,
        password: body.password,
        rememberMe: body.rememberMe,
      });

      // Successful login — clear any failed attempt counter
      clearFailedLogins(clientIP);

      await auditLogger.logLogin(session.userId, body.identifier, true, clientIP);

      const cookieMaxAge = body.rememberMe
        ? 60 * 60 * 24 * 30 // 30 days
        : 60 * 60 * 24 * 7; // 7 days

      const response = NextResponse.json({
        success: true,
        userId: session.userId,
        role: session.role,
        redirect: "/",
      });

      response.cookies.set(authCookieName, session.token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: cookieMaxAge,
      });

      return response;
    } catch (error) {
      // Record the failed attempt — may trigger IP auto-ban
      const banned = recordFailedLogin(clientIP);

      await auditLogger.logLogin("", body.identifier, false, clientIP, "Invalid credentials");

      if (banned) {
        // Auto-ban triggered — additionally blacklist for 1 hour
        blacklistIP(clientIP, 60 * 60 * 1000);
        await auditLogger.log({
          eventType: AuditEventType.SUSPICIOUS_ACTIVITY,
          ipAddress: clientIP,
          resource: "auth/login",
          success: false,
          errorMessage: "IP auto-banned after repeated login failures",
        });
      }

      // Handle database connectivity issues distinctly
      const errorMessage = error instanceof Error ? error.message : "";
      if (errorMessage.includes("P1001") || errorMessage.includes("Can't reach database")) {
        return NextResponse.json(
          { success: false, message: "Service temporarily unavailable. Please try again later." },
          { status: 503 }
        );
      }

      // Always return the same generic message — prevents user enumeration
      return NextResponse.json(
        { success: false, message: GENERIC_AUTH_ERROR },
        { status: 401 }
      );
    }
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request format" },
      { status: 400 }
    );
  }
}