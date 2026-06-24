import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcrypt";
import { AuthController } from "@/controllers/authController";
import { authCookieName } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;
  if (!token) return null;
  try {
    const controller = new AuthController();
    return await controller.validateSession(token);
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false }, { status: 401 });
    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { 
        id: true, 
        name: true, 
        email: true, 
        employeeNo: true, 
        role: true, 
        createdAt: true, 
        lastLoginAt: true,
        storeId: true,
        store: { select: { id: true, name: true } },
        images: { orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }] }
      },
    });
    if (!user) return NextResponse.json({ success: false }, { status: 404 });
    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false }, { status: 401 });

    const body = await request.json();
    const { name, email, storeId, currentPassword, newPassword } = body;

    const user = await prisma.user.findUnique({ where: { id: session.sub } });
    if (!user) return NextResponse.json({ success: false }, { status: 404 });

    // Only Admin can change password
    if (newPassword && user.role !== "ADMIN") {
      return NextResponse.json({ 
        success: false, 
        message: "Only Admin users are allowed to change passwords" 
      }, { status: 403 });
    }

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ success: false, message: "Current password is required" }, { status: 400 });
      }
      const valid = await bcrypt.compare(currentPassword, user.hashedPassword);
      if (!valid) {
        return NextResponse.json({ success: false, message: "Current password is incorrect" }, { status: 400 });
      }
    }

    if (email && email !== user.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json({ success: false, message: "Email already in use" }, { status: 400 });
      }
    }

    // Only Admin can change store assignment
    const storeIdUpdate = storeId !== undefined && session.role === "ADMIN" 
      ? { storeId: storeId || null } 
      : {};

    const updated = await prisma.user.update({
      where: { id: session.sub },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...storeIdUpdate,
        ...(newPassword && { hashedPassword: await bcrypt.hash(newPassword, 10) }),
      },
      select: { id: true, name: true, email: true, employeeNo: true, role: true, storeId: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Server error" }, { status: 500 });
  }
}
