import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// CSP built here so it's consistent with what middleware sets at runtime
const cspHeader = [
  "default-src 'self'",
  isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: https: blob:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' wss: ws:",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  !isDev ? "upgrade-insecure-requests" : "",
]
  .filter(Boolean)
  .join("; ");

const securityHeaders = [
  // Remove server fingerprinting
  { key: "X-Powered-By", value: "" }, // Next.js strips it via poweredByHeader: false
  // Clickjacking protection — DENY because this is a management app
  { key: "X-Frame-Options", value: "DENY" },
  // MIME sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // XSS (legacy browser protection)
  { key: "X-XSS-Protection", value: "1; mode=block" },
  // Referrer
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Permissions
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=()",
  },
  // DNS prefetch — off to prevent DNS leakage
  { key: "X-DNS-Prefetch-Control", value: "off" },
  // Cross-domain
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  // IE download protection
  { key: "X-Download-Options", value: "noopen" },
  // Content Security Policy
  { key: "Content-Security-Policy", value: cspHeader },
];

// HSTS — only in production
if (!isDev) {
  securityHeaders.push({
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  });
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  headers: async () => [
    {
      // Apply to all routes
      source: "/:path*",
      headers: securityHeaders,
    },
  ],
};

export default nextConfig;
