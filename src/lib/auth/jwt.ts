import jwt, { type Secret, type SignOptions } from "jsonwebtoken";

export type AuthTokenPayload = {
  sub: string;
  role: "ADMIN" | "ADMIN_MANAGER" | "STORE_MANAGER" | "EMPLOYEE" | "SUB_STORE_LOGIN" | "INWARD_PERSON" | "OUTWARD_PERSON";
  name?: string;
  email?: string;
  storeId?: string | null;
};

const defaultExpiry: SignOptions["expiresIn"] = "8h";

export function signAuthToken(
  payload: AuthTokenPayload,
  expiresIn: SignOptions["expiresIn"] = defaultExpiry
) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(payload, secret as Secret, { expiresIn });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.verify(token, secret) as AuthTokenPayload;
}
