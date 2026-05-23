import { NextResponse } from "next/server";

type CookieOptions = Parameters<InstanceType<typeof NextResponse>["cookies"]["set"]>[2];

export const authCookieName = "smi_session";

export const authCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 8,
};
