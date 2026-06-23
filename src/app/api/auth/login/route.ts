import { NextRequest, NextResponse } from "next/server";
import { AuthController } from "@/controllers/authController";
import { authCookieName, authCookieOptions } from "@/lib/auth/session";
import { getRateLimitKey, checkRateLimit, clearRateLimit } from "@/lib/security/rateLimit";
import { auditLogger, AuditEventType } from "@/lib/security/audit";
import { sanitizeEmail, validateInput } from "@/lib/security/validation";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const rateLimitKey = getRateLimitKey(request, "login");
    const rateLimit = checkRateLimit(rateLimitKey, "login");
    
    if (!rateLimit.allowed) {
      const retryAfter = rateLimit.blockedUntil 
        ? Math.ceil((rateLimit.blockedUntil - Date.now()) / 1000)
        : Math.ceil((rateLimit.resetAt - Date.now()) / 1000);

      await auditLogger.log({
        eventType: AuditEventType.RATE_LIMIT_EXCEEDED,
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
        resource: "auth/login",
        success: false,
        errorMessage: "Rate limit exceeded",
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
          headers: {
            "Retry-After": retryAfter.toString(),
          },
        }
      );
    }

    const body = (await request.json()) as { identifier?: string; password?: string; rememberMe?: boolean };
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;

    console.log("[Login] Received login request for:", body.identifier);

    if (!body.identifier || !body.password) {
      console.log("[Login] Missing credentials");
      return NextResponse.json({ 
        success: false,
        message: "Username/Email and password are required" 
      }, { status: 400 });
    }

    // Check if JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      console.error("[Login] JWT_SECRET is not configured");
      return NextResponse.json({ 
        success: false, 
        message: "Server configuration error. Please contact administrator." 
      }, { status: 500 });
    }

    console.log("[Login] JWT_SECRET is configured");

    const controller = new AuthController();
    try {
      console.log("[Login] Attempting authentication...");
      const session = await controller.login({ 
        identifier: body.identifier, 
        password: body.password,
        rememberMe: body.rememberMe
      });
      
      console.log("[Login] Authentication successful for user:", session.userId);
      
      const response = NextResponse.json({ 
        success: true, 
        userId: session.userId, 
        role: session.role,
        redirect: "/"
      });
      
      // Determine cookie maxAge based on rememberMe
      const cookieMaxAge = body.rememberMe 
        ? 60 * 60 * 24 * 30 // 30 days if remember me is checked
        : 60 * 60 * 24 * 7; // 7 days otherwise (changed from 8 hours)
      
      // Set cookie with proper settings for production
      response.cookies.set(authCookieName, session.token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: cookieMaxAge,
      });
      
      console.log("[Login] Cookie set with maxAge:", cookieMaxAge, "seconds, rememberMe:", body.rememberMe);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Invalid credentials";
      console.error("[Login] Authentication failed:", errorMessage);
      console.error("[Login] Full error:", error);
      
      // Return more detailed error in development
      const detailedMessage = process.env.NODE_ENV === "production" 
        ? "Invalid username or password"
        : errorMessage;
      
      // Check for specific error types
      if (errorMessage.includes("P1001") || errorMessage.includes("Can't reach database")) {
        return NextResponse.json({ 
          success: false, 
          message: "Database connection failed. Please check your connection.",
          details: process.env.NODE_ENV !== "production" ? errorMessage : undefined
        }, { status: 503 });
      }
      
      if (errorMessage.includes("P2025") || errorMessage.includes("not found")) {
        return NextResponse.json({ 
          success: false, 
          message: "Invalid username or password",
          details: process.env.NODE_ENV !== "production" ? "User not found" : undefined
        }, { status: 401 });
      }
      
      if (errorMessage.includes("JWT_SECRET")) {
        return NextResponse.json({ 
          success: false, 
          message: "Server configuration error",
          details: process.env.NODE_ENV !== "production" ? errorMessage : undefined
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        success: false, 
        message: detailedMessage,
        details: process.env.NODE_ENV !== "production" ? errorMessage : undefined
      }, { status: 401 });
    }
  } catch (error) {
    console.error("[Login] Request parsing error:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Invalid request format" 
    }, { status: 400 });
  }
}