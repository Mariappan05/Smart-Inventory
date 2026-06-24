import { NextRequest, NextResponse } from "next/server";
import { authCookieName, authCookieOptions } from "@/lib/auth/session";
import { auditLogger } from "@/lib/security/audit";
import { verifyAuthToken } from "@/lib/auth/jwt";
import { getClientIP } from "@/lib/security/ipFilter";

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);

  // Attempt to extract user info from the token for audit logging before clearing it
  const token = request.cookies.get(authCookieName)?.value;
  if (token) {
    try {
      const payload = verifyAuthToken(token);
      await auditLogger.logLogout(payload.sub, payload.email ?? "", clientIP);
    } catch {
      // Token already invalid — ignore, still clear the cookie
    }
  }

  let clearRememberedUsername = false;
  try {
    const body = await request.json();
    clearRememberedUsername = body?.clearRememberedUsername === true;
  } catch {
    // No body — fine
  }

  const response = NextResponse.json({ ok: true, clearRememberedUsername });

  response.cookies.set(authCookieName, "", {
    ...authCookieOptions,
    maxAge: 0,
  });

  return response;
}
