// Rate Limiting Middleware
import { NextRequest, NextResponse } from "next/server";
import { securityConfig } from "@/config/security";

interface RateLimitEntry {
  count: number;
  resetAt: number;
  blockedUntil?: number;
}

// In-memory store (use Redis in production for multi-instance deployments)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now && (!entry.blockedUntil || entry.blockedUntil < now)) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export type RateLimitType = "login" | "api" | "critical";

export function getRateLimitKey(request: NextRequest, prefix: string): string {
  // Use IP address or user ID for rate limiting
  const ip = request.headers.get("x-forwarded-for") || 
             request.headers.get("x-real-ip") || 
             "unknown";
  return `${prefix}:${ip}`;
}

export function checkRateLimit(
  key: string,
  type: RateLimitType = "api"
): { allowed: boolean; remaining: number; resetAt: number; blockedUntil?: number } {
  const config = securityConfig.rateLimit[type];
  const now = Date.now();
  
  let entry = rateLimitStore.get(key);

  // Check if blocked
  if (entry?.blockedUntil && entry.blockedUntil > now) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      blockedUntil: entry.blockedUntil,
    };
  }

  // Initialize or reset if window expired
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + config.windowMs,
    };
  }

  // Increment count
  entry.count++;

  // Check if limit exceeded
  const maxLimit = type === "login" ? config.maxAttempts : (config as any).maxRequests;
  
  if (entry.count > maxLimit) {
    // Block for login attempts
    if (type === "login" && "blockDuration" in config) {
      entry.blockedUntil = now + config.blockDuration;
    }
    
    rateLimitStore.set(key, entry);
    
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      blockedUntil: entry.blockedUntil,
    };
  }

  rateLimitStore.set(key, entry);

  return {
    allowed: true,
    remaining: maxLimit - entry.count,
    resetAt: entry.resetAt,
  };
}

export function rateLimitMiddleware(type: RateLimitType = "api") {
  return (request: NextRequest): NextResponse | null => {
    const key = getRateLimitKey(request, type);
    const result = checkRateLimit(key, type);

    if (!result.allowed) {
      const retryAfter = result.blockedUntil 
        ? Math.ceil((result.blockedUntil - Date.now()) / 1000)
        : Math.ceil((result.resetAt - Date.now()) / 1000);

      return NextResponse.json(
        {
          success: false,
          error: "Too many requests",
          message: result.blockedUntil 
            ? `Too many failed attempts. Please try again after ${Math.ceil(retryAfter / 60)} minutes.`
            : "Rate limit exceeded. Please try again later.",
          retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": retryAfter.toString(),
            "X-RateLimit-Limit": type === "login" 
              ? securityConfig.rateLimit.login.maxAttempts.toString()
              : securityConfig.rateLimit.api.maxRequests.toString(),
            "X-RateLimit-Remaining": result.remaining.toString(),
            "X-RateLimit-Reset": new Date(result.resetAt).toISOString(),
          },
        }
      );
    }

    return null; // Allow request to proceed
  };
}

export function clearRateLimit(key: string): void {
  rateLimitStore.delete(key);
}
