import { NextRequest, NextResponse } from "next/server";
import { UserRepository } from "@/repositories/userRepository";
import bcrypt from "bcrypt";
import { requireStrictAdmin } from "@/lib/auth/permissions";

const userRepository = new UserRepository();

export async function GET(request: NextRequest) {
  const authResult = await requireStrictAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const users = await userRepository.findAll();
    return NextResponse.json({
      success: true,
      data: users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        employeeNo: user.employeeNo,
        role: user.role,
        storeId: user.storeId,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch users",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireStrictAdmin(request);
  if (authResult instanceof NextResponse) return authResult;
  try {
    const body = await request.json();
    const { employeeNo, name, email, password, role, storeId } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    // ALL users must have a storeId - strict store isolation
    if (!storeId || storeId.trim() === "") {
      return NextResponse.json(
        { success: false, message: "Store is required for all users" },
        { status: 400 }
      );
    }

    // Check for duplicate email
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Duplicate email",
          message: `Email "${email}" is already registered. Please use a different email.`,
        },
        { status: 409 }
      );
    }

    let generatedEmployeeNo = employeeNo;
    if (!generatedEmployeeNo) {
      const rolePrefix: Record<string, string> = {
        ADMIN: "AD",
        ADMIN_MANAGER: "ADMM",
        STORE_MANAGER: "SM",
        SUB_STORE_LOGIN: "SS",
        INWARD_PERSON: "IP",
        OUTWARD_PERSON: "OP",
      };
      const prefix = rolePrefix[role] || "EMP";
      const allUsers = await userRepository.findAll();
      const usersWithPrefix = allUsers.filter(u => u.employeeNo?.startsWith(prefix));
      const maxNumber = usersWithPrefix.reduce((max, user) => {
        const num = parseInt(user.employeeNo?.replace(prefix, "") || "0");
        return num > max ? num : max;
      }, 0);
      generatedEmployeeNo = `${prefix}${String(maxNumber + 1).padStart(3, "0")}`;
    } else {
      // Check for duplicate employee number if provided
      const existingEmployeeNo = await userRepository.findByEmployeeNo(generatedEmployeeNo);
      if (existingEmployeeNo) {
        return NextResponse.json(
          {
            success: false,
            error: "Duplicate employee number",
            message: `Employee number "${generatedEmployeeNo}" already exists. Please use a different number.`,
          },
          { status: 409 }
        );
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userRepository.create({
      employeeNo: generatedEmployeeNo,
      name,
      email,
      hashedPassword: hashedPassword,
      role: role || "EMPLOYEE",
      isActive: true,
      ...(storeId && storeId.trim() !== "" ? { store: { connect: { id: storeId } } } : {}),
    });

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        employeeNo: user.employeeNo,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        storeId: user.storeId,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Failed to create user:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to create user",
      },
      { status: 500 }
    );
  }
}
