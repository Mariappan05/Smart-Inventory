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

    const url = new URL(request.url);
    const includeDetails = url.searchParams.get("details") === "true";

    let name = payload.name ?? null;
    let imageUrl = null;
    let store = null;
    let pagePermissions: any[] = [];

    if (includeDetails) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: payload.sub },
          select: {
            name: true,
            storeId: true,
            images: {
              select: { url: true, isPrimary: true },
              orderBy: { isPrimary: "desc" },
              take: 1,
            },
            store: {
              select: { id: true, code: true, name: true },
            },
            pagePermissions: {
              select: {
                pageName: true,
                canView: true,
                canCreate: true,
                canEdit: true,
                canDelete: true,
              },
            },
          },
        });

        if (user) {
          name = user.name;
          imageUrl = user.images?.[0]?.url || null;
          store = user.store;
          pagePermissions = user.pagePermissions;

          // Re-sign token with latest permissions and save in cookie to sync it
          try {
            const formattedPerms: Record<string, any> = {};
            pagePermissions.forEach((p: any) => {
              formattedPerms[p.pageName] = {
                canView: p.canView,
                canCreate: p.canCreate,
                canEdit: p.canEdit,
                canDelete: p.canDelete
              };
            });
            
            const secret = process.env.JWT_SECRET;
            if (secret) {
              const { signAuthToken } = require("@/lib/auth/jwt");
              const newToken = signAuthToken({
                sub: payload.sub,
                role: payload.role,
                name: user.name,
                email: payload.email,
                storeId: user.storeId,
                pagePermissions: formattedPerms
              });
              
              // Set the new token in the cookie
              cookieStore.set(authCookieName, newToken, {
                httpOnly: true,
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
                path: "/",
                maxAge: 60 * 60 * 24 * 7 // 7 days
              });
            }
          } catch (tokenErr) {
            console.error("Failed to refresh token with updated permissions:", tokenErr);
          }
        }
      } catch {
        // Database unavailable — fall back to token payload data
      }
    }

    return NextResponse.json({
      authenticated: true,
      success: true,
      userId: payload.sub,
      role: payload.role,
      name,
      imageUrl,
      store,
      pagePermissions,
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
