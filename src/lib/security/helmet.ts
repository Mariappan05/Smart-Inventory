import { NextRequest, NextResponse } from "next/server";

export function applySecurityHeaders(response: NextResponse): NextResponse {
  const headers = response.headers;

  headers.set("X-DNS-Prefetch-Control", "off");
  headers.set("X-Frame-Options", "SAMEORIGIN");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-XSS-Protection", "1; mode=block");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  
  if (process.env.NODE_ENV === "production") {
    headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  headers.delete("X-Powered-By");
  
  return response;
}
