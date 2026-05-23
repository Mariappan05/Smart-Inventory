import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AuthController } from "@/controllers/authController";
import { authCookieName } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const controller = new AuthController();
  try {
    const payload = await controller.validateSession(token);
    
    // Check if client needs detailed user info (from query param)
    const url = new URL(request.url);
    const includeDetails = url.searchParams.get("details") === "true";
    
    let name = payload.name ?? null;
    let imageUrl = null;
    
    // Only fetch from database if details are explicitly requested
    if (includeDetails) {
      try {
        const user = await prisma.user.findUnique({ 
          where: { id: payload.sub }, 
          select: { 
            name: true,
            images: {
              select: { url: true, isPrimary: true },
              orderBy: { isPrimary: "desc" },
              take: 1,
            },
          },
        });
        
        if (user) {
          name = user.name;
          imageUrl = user.images?.[0]?.url || null;
        }
      } catch (dbError) {
        console.warn("[Session] Database error fetching user details, using token payload", dbError);
        // Continue with token payload data if database fails
      }
    }
    
    return NextResponse.json({ 
      authenticated: true, 
      userId: payload.sub, 
      role: payload.role, 
      name,
      imageUrl,
    });
  } catch (error) {
    console.error("[Session] Validation error:", error);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
