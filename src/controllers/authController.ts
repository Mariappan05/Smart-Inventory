import { AuthService } from "@/services/authService";
import { verifyAuthToken, type AuthTokenPayload } from "@/lib/auth/jwt";
import { toServiceError } from "@/services/base/serviceError";

export type LoginInput = {
  identifier: string;
  password: string;
};

export class AuthController {
  constructor(private readonly authService = new AuthService()) {}

  async login(input: LoginInput) {
    try {
      const result = await this.authService.login(input.identifier, input.password);
      return { token: result.token, userId: result.userId, role: result.role };
    } catch (error) {
      throw toServiceError(error, "Login failed");
    }
  }

  async validateSession(token: string): Promise<AuthTokenPayload> {
    try {
      return verifyAuthToken(token);
    } catch (error) {
      throw toServiceError(error, "Invalid session");
    }
  }
}
