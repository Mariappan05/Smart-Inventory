import { NextRequest, NextResponse } from "next/server";
import { UserRepository } from "@/repositories/userRepository";
import bcrypt from "bcrypt";
import { requireStrictAdmin } from "@/lib/auth/permissions";
import { parseBody, createUserSchema } from "@/validations/schemas";

const userRepository = new UserRepository();

export async function GET(request: NextRequest) {
  const authResult = await requireStrictAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const users = await userRepository.findAll();
    return NextResponse.json({
      success: true,
      data: users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        employeeNo: user.employeeNo,
        role: user.role,
        storeId: user.storeId,
        isActive: user.isActive,
        createdAt: user.createdAt,
      })),
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireStrictAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request body" },
      { status: 400 }
    );
  }

  // Zod validation — enforces password policy + all field constraints
  const parsed = parseBody(createUserSchema, rawBody);
  if ("error" in parsed) return parsed.error;
  const { name, email, password, role, storeId, employeeNo } = parsed.data;

  try {
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

    // Auto-generate or validate employee number
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
      const prefix = rolePrefix[String(role)] ?? "EMP";
      const allUsers = await userRepository.findAll();
      const usersWithPrefix = allUsers.filter((u) => u.employeeNo?.startsWith(prefix));
      const maxNumber = usersWithPrefix.reduce((max, user) => {
        const num = parseInt(user.employeeNo?.replace(prefix, "") || "0", 10);
        return num > max ? num : max;
      }, 0);
      generatedEmployeeNo = `${prefix}${String(maxNumber + 1).padStart(3, "0")}`;
    } else {
      const existingEmployeeNo = await userRepository.findByEmployeeNo(generatedEmployeeNo);
      if (existingEmployeeNo) {
        return NextResponse.json(
          {
            success: false,
            error: "Duplicate employee number",
            message: `Employee number "${generatedEmployeeNo}" already exists.`,
          },
          { status: 409 }
        );
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12); // increased from 10 → 12 rounds

    const user = await userRepository.create({
      employeeNo: generatedEmployeeNo,
      name,
      email,
      hashedPassword,
      role,
      isActive: true,
      store: { connect: { id: storeId } },
    });

    return NextResponse.json(
      {
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
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to create user" },
      { status: 500 }
    );
  }
}
