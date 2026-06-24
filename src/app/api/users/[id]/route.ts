import { NextRequest, NextResponse } from "next/server";
import { UserRepository } from "@/repositories/userRepository";
import { requireStrictAdmin } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

const userRepository = new UserRepository();

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireStrictAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, email, role, storeId, isActive, password } = body;

    // Build update object with only provided fields
    const updateData: any = {};

    if (name !== undefined) {
      updateData.name = name;
    }

    if (email !== undefined) {
      // Check if email is already in use by another user
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id }, // Exclude current user
        },
      });

      if (existingUser) {
        return NextResponse.json(
          {
            success: false,
            message: `Email "${email}" is already in use by another user`,
          },
          { status: 409 }
        );
      }

      updateData.email = email;
    }

    if (role !== undefined) {
      updateData.role = role;
    }

    if (storeId !== undefined) {
      if (!storeId || storeId.trim() === "") {
        return NextResponse.json(
          { success: false, message: "Store is required for all users" },
          { status: 400 }
        );
      }
      updateData.storeId = storeId;
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    if (password !== undefined && password.trim() !== "") {
      if (password.length < 6) {
        return NextResponse.json(
          { success: false, message: "Password must be at least 6 characters" },
          { status: 400 }
        );
      }
      updateData.hashedPassword = await bcrypt.hash(password, 10);
    }

    // If no fields provided, return error
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, message: "No fields to update" },
        { status: 400 }
      );
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        employeeNo: true,
        name: true,
        email: true,
        role: true,
        storeId: true,
        isActive: true,
        store: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
        images: {
          select: {
            url: true,
            isPrimary: true,
          },
          orderBy: {
            isPrimary: "desc",
          },
          take: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updatedUser,
        imageUrl: updatedUser.images?.[0]?.url || null,
      },
      message: "User updated successfully",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to update user",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireStrictAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await userRepository.findById(id);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Delete user
    await userRepository.delete(id);

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to delete user",
      },
      { status: 500 }
    );
  }
}
