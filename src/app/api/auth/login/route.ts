import { NextRequest, NextResponse } from "next/server";
import { AuthController } from "@/controllers/authController";
import { authCookieName, authCookieOptions } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
    try {
    const body = (await request.json()) as { identifier?: string; password?: string };

    if (!body.identifier || !body.password) {
      return NextResponse.json({ message: "Username/Email and password are required" }, { status: 400 });
    }

    const controller = new AuthController();
    try {
      const session = await controller.login({ identifier: body.identifier, password: body.password });
      
      const response = NextResponse.json({ 
        success: true, 
        userId: session.userId, 
        role: session.role,
        redirect: "/"
      });
      
      response.cookies.set(authCookieName, session.token, {
        ...authCookieOptions,
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        path: "/",
      });
      
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Invalid credentials";
      console.error("[Login] Authentication failed:", errorMessage);
      
      // Check if it's a database connection error
      if (errorMessage.includes("P1001") || errorMessage.includes("Can't reach database")) {
        return NextResponse.json({ 
          success: false, 
          message: "Database connection failed. Please try again." 
        }, { status: 503 });
      }
      
      return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });
    }
  } catch (error) {
    console.error("[Login] Request parsing error:", error);
    return NextResponse.json({ success: false, message: "Invalid request" }, { status: 400 });
  }
}
