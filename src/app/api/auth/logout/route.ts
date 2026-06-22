import { NextRequest, NextResponse } from "next/server";
import { authCookieName, authCookieOptions } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({ clearRememberedUsername: false }));
    const clearRememberedUsername = body?.clearRememberedUsername === true;

    const response = NextResponse.json({ 
      ok: true, 
      clearRememberedUsername 
    });
    
    // Clear auth cookie
    response.cookies.set(authCookieName, "", { 
      ...authCookieOptions, 
      maxAge: 0 
    });
    
    console.log("[Logout] Session cleared, clearRememberedUsername:", clearRememberedUsername);
    
    return response;
  } catch (error) {
    console.error("Logout error:", error);
    const response = NextResponse.json({ ok: true, clearRememberedUsername: false });
    response.cookies.set(authCookieName, "", { 
      ...authCookieOptions, 
      maxAge: 0 
    });
    return response;
  }
}
