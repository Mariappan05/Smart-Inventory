import { NextRequest, NextResponse } from "next/server";
import { AuthController } from "@/controllers/authController";
import { authCookieName, authCookieOptions } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { identifier?: string; password?: string };

    if (!body.identifier || !body.password) {
      return NextResponse.json({ 
        success: false,
        message: "Username/Email and password are required" 
      }, { status: 400 });
    }

    // Check if JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      console.error("[Login] JWT_SECRET is not configured");
      return NextResponse.json({ 
        success: false, 
        message: "Server configuration error. Please contact administrator." 
      }, { status: 500 });
    }

    const controller = new AuthController();
    try {
      const session = await controller.login({ 
        identifier: body.identifier, 
        password: body.password 
      });
      
      const response = NextResponse.json({ 
        success: true, 
        userId: session.userId, 
        role: session.role,
        redirect: "/"
      });
      
      // Set cookie with proper settings for production
      response.cookies.set(authCookieName, session.token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 8, // 8 hours
      });
      
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Invalid credentials";
      console.error("[Login] Authentication failed:", errorMessage);
      
      // Check for specific error types
      if (errorMessage.includes("P1001") || errorMessage.includes("Can't reach database")) {
        return NextResponse.json({ 
          success: false, 
          message: "Database connection failed. Please check your connection." 
        }, { status: 503 });
      }
      
      if (errorMessage.includes("P2025") || errorMessage.includes("not found")) {
        return NextResponse.json({ 
          success: false, 
          message: "Invalid username or password" 
        }, { status: 401 });
      }
      
      return NextResponse.json({ 
        success: false, 
        message: "Invalid username or password" 
      }, { status: 401 });
    }
  } catch (error) {
    console.error("[Login] Request parsing error:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Invalid request format" 
    }, { status: 400 });
  }
}