import { NextResponse, type NextRequest } from "next/server";
import { authCookieName } from "@/lib/auth/session";
import { canAccessPath, type UserRole } from "@/lib/auth/permissions";
import { applySecurityHeaders } from "@/lib/security/helmet";
import { getClientIP, isIPBlacklisted } from "@/lib/security/ipFilter";
import { auditLogger, AuditEventType } from "@/lib/security/audit";

const publicPaths = new Set(["/login", "/api/auth/login", "/api/auth/logout", "/api/auth/session"]);

function isPublicPath(pathname: string) {
  if (publicPaths.has(pathname)) {
    return true;
  }

  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon.ico") || pathname.startsWith("/.well-known")) {
    return true;
  }

  return false;
}

// API routes that handle their own auth/permissions - skip middleware permission check
function isAuthHandledByRoute(pathname: string) {
  // API routes that have requireAuth or requireAdmin in their implementation
  // These routes verify authentication themselves, so middleware just needs to verify the token exists
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
    // Production routes (history, component-codes, batch, etc.)
    "/api/production",
    // Report export / generation routes
    "/api/reports",
    // Alert acknowledgement / resolution routes
    "/api/alerts",
    // Store listing used by multiple pages
    "/api/stores",
    // Store room management
    "/api/store-rooms",
    // Notifications
    "/api/notifications",
    // Supplier PO routes
    "/api/supplier-po",
  ];
  
  return authHandledRoutes.some(route => pathname.startsWith(route));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApiRoute = pathname.startsWith("/api/");
  
  // IP blacklist check
  const clientIP = getClientIP(request);
  if (isIPBlacklisted(clientIP)) {
    await auditLogger.log({
      eventType: AuditEventType.ACCESS_DENIED,
      ipAddress: clientIP,
      resource: pathname,
      success: false,
      errorMessage: "Blacklisted IP",
    });
    
    return NextResponse.json(
      { success: false, message: "Access denied" },
      { status: 403 }
    );
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(authCookieName)?.value;
  
  if (!token) {
    if (isApiRoute) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  // Verify token via API call (fast path - no user details)
  try {
    const verifyUrl = new URL("/api/auth/session", request.url);
    // Don't request detailed user info from middleware - only need role
    const verifyResponse = await fetch(verifyUrl, {
      headers: {
        cookie: `${authCookieName}=${token}`,
      },
    });

    if (!verifyResponse.ok) {
      if (isApiRoute) {
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
      }

      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      return NextResponse.redirect(loginUrl);
    }

    const session = await verifyResponse.json();
    const role = session.role as UserRole;
    
    // Skip permission check for API routes that handle their own auth
    // Middleware just verified the token is valid; these routes handle specific permissions
    if (isAuthHandledByRoute(pathname)) {
      return NextResponse.next();
    }
    
    // Check if user has access to this page path
    if (!canAccessPath(role, pathname)) {
      if (isApiRoute) {
        return NextResponse.json({ success: false, message: "Forbidden - Access Denied" }, { status: 403 });
      }
      
      // Redirect to home or access denied page
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = "/";
      return NextResponse.redirect(homeUrl);
    }
    
  } catch (error) {
    if (isApiRoute) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();
  return applySecurityHeaders(response);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.well-known).*)"],
  runtime: "nodejs",
};
