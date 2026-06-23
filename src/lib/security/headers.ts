// Security Headers Middleware
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { securityConfig } from "@/config/security";

export function securityHeaders(request: NextRequest, response: NextResponse): NextResponse {
  const headers = new Headers(response.headers);

  // Content Security Policy
  const cspDirectives = Object.entries(securityConfig.csp.directives)
    .filter(([_, value]) => value !== null)
    .map(([key, value]) => {
      const directive = key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
      if (Array.isArray(value) && value.length > 0) {
        return `${directive} ${value.join(" ")}`;
      }
      return directive;
    })
    .join("; ");

  headers.set("Content-Security-Policy", cspDirectives);

  // Strict Transport Security (HSTS)
  if (process.env.NODE_ENV === "production") {
    headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  // X-Frame-Options (prevent clickjacking)
  headers.set("X-Frame-Options", "DENY");

  // X-Content-Type-Options (prevent MIME sniffing)
  headers.set("X-Content-Type-Options", "nosniff");

  // X-XSS-Protection (legacy browsers)
  headers.set("X-XSS-Protection", "1; mode=block");

  // Referrer Policy
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions Policy
  headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );

  // Remove server identification
  headers.delete("Server");
  headers.delete("X-Powered-By");

  // Add custom security headers
  headers.set("X-DNS-Prefetch-Control", "off");
  headers.set("X-Download-Options", "noopen");
  headers.set("X-Permitted-Cross-Domain-Policies", "none");

  // CORS headers (if applicable)
  const origin = request.headers.get("origin");
  if (origin && securityConfig.cors.allowedOrigins.includes(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set(
      "Access-Control-Allow-Methods",
      securityConfig.cors.allowedMethods.join(", ")
    );
    headers.set(
      "Access-Control-Allow-Headers",
      securityConfig.cors.allowedHeaders.join(", ")
    );
    headers.set(
      "Access-Control-Expose-Headers",
      securityConfig.cors.exposedHeaders.join(", ")
    );
    headers.set(
      "Access-Control-Max-Age",
      securityConfig.cors.maxAge.toString()
    );
  }

  return NextResponse.next({
    request,
    headers,
  });
}

export function generateNonce(): string {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString("base64");
}

export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }
  
  return response;
}
