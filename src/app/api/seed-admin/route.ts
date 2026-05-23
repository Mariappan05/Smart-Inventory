import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST() {
  try {
    const adminEmail = "admin@your-company.local";
    const adminPassword = "Admin@123";
    const adminHashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create store first
    const store = await prisma.store.upsert({
      where: { name: "Chennai" },
      update: {},
      create: {
        name: "Chennai",
        code: "STORE001",
      },
    });

    // Create admin user
    const admin = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        hashedPassword: adminHashedPassword,
        role: "ADMIN",
        name: "Admin",
        storeId: store.id,
      },
      create: {
        employeeNo: "ADM001",
        email: adminEmail,
        name: "Admin",
        role: "ADMIN",
        hashedPassword: adminHashedPassword,
        storeId: store.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Admin user created successfully",
      admin: {
        email: admin.email,
        role: admin.role,
        employeeNo: admin.employeeNo
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
