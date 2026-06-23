import { NextRequest, NextResponse } from "next/server";
import { getRateLimitKey, checkRateLimit, type RateLimitType } from "./rateLimit";
import { validateInput } from "./validation";
import { getClientIP } from "./ipFilter";
import { auditLogger, AuditEventType } from "./audit";

type Handler = (req: NextRequest) => Promise<NextResponse>;

interface SecureRouteOptions {
  rateLimit?: RateLimitType;
  requireAuth?: boolean;
  validateBody?: boolean;
}

export function secureRoute(handler: Handler, options: SecureRouteOptions = {}) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const { rateLimit = "api", requireAuth = true, validateBody = true } = options;

    // Rate limiting
    if (rateLimit) {
      const key = getRateLimitKey(request, rateLimit);
      const result = checkRateLimit(key, rateLimit);

      if (!result.allowed) {
        return NextResponse.json(
          { success: false, message: "Rate limit exceeded" },
          { status: 429 }
        );
      }
    }

    // Body validation for POST/PUT/PATCH
    if (validateBody && ["POST", "PUT", "PATCH"].includes(request.method)) {
      try {
        const body = await request.json();
        
        if (typeof body === "object" && body !== null) {
          for (const [key, value] of Object.entries(body)) {
            if (typeof value === "string") {
              validateInput(value, key);
            }
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Invalid input";
        
        await auditLogger.log({
          eventType: AuditEventType.SUSPICIOUS_ACTIVITY,
          ipAddress: getClientIP(request),
          resource: request.nextUrl.pathname,
          success: false,
          errorMessage: message,
        });

        return NextResponse.json(
          { success: false, message },
          { status: 400 }
        );
      }
    }

    return handler(request);
  };
}
