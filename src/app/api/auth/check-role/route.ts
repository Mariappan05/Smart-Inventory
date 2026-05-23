import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/auth/jwt";
import { authCookieName } from "@/lib/auth/session";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(authCookieName)?.value;

    if (!token) {
      return Response.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    const payload = verifyAuthToken(token);
    
    return Response.json(
      {
        success: true,
        role: payload.role,
        userId: payload.sub,
      },
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      { success: false, message: "Failed to verify token" },
      { status: 401 }
    );
  }
}
