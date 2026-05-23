import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserRepository } from "@/repositories/userRepository";
import { toServiceError } from "@/services/base/serviceError";

export type AuthResult = {
  token: string;
  userId: string;
  role: string;
};

export type RegisterInput = {
  employeeNo: string;
  email: string;
  name: string;
  role?: "ADMIN" | "EMPLOYEE";
  password: string;
};

export class AuthService {
  constructor(private readonly userRepository = new UserRepository()) {}

  async register(input: RegisterInput) {
    try {
      const hashedPassword = await bcrypt.hash(input.password, 10);
      const user = await this.userRepository.create({
        employeeNo: input.employeeNo,
        email: input.email,
        name: input.name,
        role: input.role ?? "EMPLOYEE",
        hashedPassword,
        isActive: true,
      });

      return user;
    } catch (error) {
      throw toServiceError(error, "Failed to register user");
    }
  }

  async login(identifier: string, password: string): Promise<AuthResult> {
    try {
      let user = null;
      
      try {
        user = await this.userRepository.findByEmail(identifier);
      } catch (emailError) {
        console.warn("[AuthService] Error finding user by email, trying employee number:", emailError);
      }
      
      if (!user) {
        try {
          const users = await this.userRepository.findAll();
          user = users.find(u => u.employeeNo === identifier) || null;
        } catch (allUsersError) {
          console.error("[AuthService] Error fetching all users:", allUsersError);
          throw new Error("Database connection failed. Please try again.");
        }
      }
      
      if (!user || !user.isActive) {
        throw new Error("Invalid credentials");
      }

      const isValid = await bcrypt.compare(password, user.hashedPassword);
      if (!isValid) {
        throw new Error("Invalid credentials");
      }

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error("JWT_SECRET is not configured");
      }

      const token = jwt.sign({ sub: user.id, role: user.role, name: user.name, email: user.email, storeId: user.storeId }, secret, { expiresIn: "8h" });

      try {
        await this.userRepository.update(user.id, { lastLoginAt: new Date() });
      } catch (updateError) {
        console.warn("[AuthService] Failed to update lastLoginAt:", updateError);
        // Don't fail login if we can't update lastLoginAt
      }

      return { token, userId: user.id, role: user.role };
    } catch (error) {
      throw toServiceError(error, "Failed to authenticate user");
    }
  }
}
