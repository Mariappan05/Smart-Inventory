import { NextResponse, type NextRequest } from "next/server";
import { authCookieName } from "@/lib/auth/session";
import { canAccessPath, getModuleNameFromPath, type UserRole } from "@/lib/auth/permissions";
import { verifyAuthToken } from "@/lib/auth/jwt";
import { securityConfig } from "@/config/security";

// ── Public paths (no auth needed) ──────────────────────────────────────────────
const publicPaths = new Set([
  "/login",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/session",
  "/api/health",
]);

function isPublicPath(pathname: string): boolean {
  if (publicPaths.has(pathname)) return true;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/.well-known")
  ) return true;
  return false;
}

// ── Routes that handle their own auth internally ───────────────────────────────
function isAuthHandledByRoute(pathname: string): boolean {
  const authHandledRoutes = [
    "/api/monthly-schedule/",
    "/api/products/",
    "/api/machines/",
    "/api/suppliers/",
    "/api/tools/",
    "/api/inward/",
    "/api/outward/",
    "/api/schedules/",
    "/api/requests/",
    "/api/categories/",
    "/api/types/",
    "/api/items/",
    "/api/qr/",
    "/api/maintenance/",
    "/api/users",
    "/api/profile",
    "/api/plants",
    "/api/production",
    "/api/production-component-codes",
    "/api/production-history",
    "/api/product-process",
    "/api/reports",
    "/api/alerts",
    "/api/stores",
    "/api/store-rooms",
    "/api/notifications",
    "/api/supplier-po",
    "/api/uploads",
    "/api/seed-admin",
  ];
  return authHandledRoutes.some((route) => pathname.startsWith(route));
}

// ── In-memory rate limiter (lightweight — no external imports) ──────────────────
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RL_WINDOW_MS = 60_000; // 1 minute
const RL_MAX = 100;          // 100 req/min per IP

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  let entry = rateLimitStore.get(ip);

  if (!entry || entry.resetAt < now) {
    entry = { count: 1, resetAt: now + RL_WINDOW_MS };
    rateLimitStore.set(ip, entry);
    return true; // allowed
  }

  entry.count++;
  return entry.count <= RL_MAX;
}

// Periodic cleanup — every 2 minutes
if (typeof globalThis !== "undefined") {
  const CLEANUP_KEY = "__rl_cleanup";
  if (!(globalThis as Record<string, unknown>)[CLEANUP_KEY]) {
    (globalThis as Record<string, unknown>)[CLEANUP_KEY] = true;
    setInterval(() => {
      const now = Date.now();
      for (const [ip, entry] of rateLimitStore.entries()) {
        if (entry.resetAt < now) rateLimitStore.delete(ip);
      }
    }, 120_000);
  }
}

// ── In-memory IP blacklist ──────────────────────────────────────────────────────
const blacklistedIPs = new Map<string, number>(); // ip → unblock timestamp (0 = permanent)

function isIPBlacklisted(ip: string): boolean {
  const unblockAt = blacklistedIPs.get(ip);
  if (unblockAt === undefined) return false;
  if (unblockAt === 0) return true; // permanent
  if (Date.now() < unblockAt) return true;
  blacklistedIPs.delete(ip); // expired
  return false;
}

// ── CSP builder ─────────────────────────────────────────────────────────────────
function buildCSP(): string {
  return Object.entries(securityConfig.csp.directives)
    .filter(([, value]) => value !== null)
    .map(([key, value]) => {
      const directive = key.replace(/[A-Z]/g, (l) => `-${l.toLowerCase()}`);
      if (Array.isArray(value) && value.length > 0) return `${directive} ${value.join(" ")}`;
      return directive;
    })
    .join("; ");
}

let cachedCSP: string | null = null;
function getCSP(): string {
  if (!cachedCSP) cachedCSP = buildCSP();
  return cachedCSP;
}

// ── Security headers ────────────────────────────────────────────────────────────
function applySecurityHeaders(response: NextResponse): NextResponse {
  const h = response.headers;

  h.delete("X-Powered-By");
  h.delete("Server");

  h.set("X-Frame-Options", "DENY");
  h.set("X-Content-Type-Options", "nosniff");
  h.set("X-XSS-Protection", "1; mode=block");
  h.set("Referrer-Policy", "strict-origin-when-cross-origin");
  h.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=()");
  h.set("X-DNS-Prefetch-Control", "off");
  h.set("X-Permitted-Cross-Domain-Policies", "none");
  h.set("X-Download-Options", "noopen");
  h.set("Content-Security-Policy", getCSP());

  if (process.env.NODE_ENV === "production") {
    h.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }

  return response;
}

// ── Client IP extraction ────────────────────────────────────────────────────────
function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MIDDLEWARE — no fetch() calls, no Prisma imports, fast & self-contained
// ═══════════════════════════════════════════════════════════════════════════════
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApiRoute = pathname.startsWith("/api/");
  const clientIP = getClientIP(request);

  // ── 1. IP blacklist ──────────────────────────────────────────────────────
  if (isIPBlacklisted(clientIP)) {
    const res = NextResponse.json(
      { success: false, message: "Access denied" },
      { status: 403 }
    );
    return applySecurityHeaders(res);
  }

  // ── 2. Public paths — just add headers ──────────────────────────────────
  if (isPublicPath(pathname)) {
    return applySecurityHeaders(NextResponse.next());
  }

  // ── 3. API rate limiting ────────────────────────────────────────────────
  if (isApiRoute && !checkRateLimit(clientIP)) {
    const res = NextResponse.json(
      { success: false, message: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
    return applySecurityHeaders(res);
  }

  // ── 4. Auth: verify JWT directly (NO fetch to self) ─────────────────────
  const token = request.cookies.get(authCookieName)?.value;

  if (!token) {
    if (isApiRoute) {
      return applySecurityHeaders(
        NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
      );
    }
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  try {
    const payload = verifyAuthToken(token);
    const role = payload.role as UserRole;
    const pagePermissions = (payload as any).pagePermissions;

    // Enforce granular page permissions if they are present in the token
    if (pagePermissions) {
      const moduleName = getModuleNameFromPath(pathname);
      if (moduleName && pagePermissions[moduleName]) {
        const perm = pagePermissions[moduleName];
        let isAllowed = true;

        if (isApiRoute) {
          const method = request.method;
          if (method === "GET") {
            isAllowed = perm.canView;
          } else if (method === "POST") {
            isAllowed = perm.canCreate;
          } else if (method === "PUT" || method === "PATCH") {
            isAllowed = perm.canEdit;
          } else if (method === "DELETE") {
            isAllowed = perm.canDelete;
          }
        } else {
          isAllowed = perm.canView;
        }

        if (!isAllowed) {
          if (isApiRoute) {
            return applySecurityHeaders(
              NextResponse.json(
                { success: false, message: `Access denied for module: ${moduleName}` },
                { status: 403 }
              )
            );
          }
          const accessDeniedUrl = request.nextUrl.clone();
          accessDeniedUrl.pathname = "/access-denied";
          return NextResponse.redirect(accessDeniedUrl);
        }
      }
    }

    // Routes that handle their own permissions internally
    if (isAuthHandledByRoute(pathname)) {
      return applySecurityHeaders(NextResponse.next());
    }

    // Page-level permission check
    if (!canAccessPath(role, pathname)) {
      if (isApiRoute) {
        return applySecurityHeaders(
          NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
        );
      }
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = "/";
      return NextResponse.redirect(homeUrl);
    }
  } catch {
    // Token invalid/expired
    if (isApiRoute) {
      return applySecurityHeaders(
        NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
      );
    }
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  // ── 5. Allow — attach headers ───────────────────────────────────────────
  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.well-known).*)"],
  runtime: "nodejs",
};
