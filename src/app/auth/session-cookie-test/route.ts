import { NextResponse } from "next/server";
import { QIMEIDE_ACCESS_COOKIE, QIMEIDE_EMAIL_COOKIE, QIMEIDE_REFRESH_COOKIE, getQimeideCookieDomain } from "@/lib/auth/server-session-cookies";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const response = NextResponse.json(
    {
      ok: true,
      message: "已尝试写入站内登录测试 Cookie。"
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );

  const domain = getQimeideCookieDomain();
  const baseOptions = {
    path: "/",
    domain,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: 600
  };

  response.cookies.set(QIMEIDE_EMAIL_COOKIE, "cookie-test@qimeide.com", baseOptions);
  response.cookies.set(QIMEIDE_ACCESS_COOKIE, "cookie-test-access", {
    ...baseOptions,
    httpOnly: true
  });
  response.cookies.set(QIMEIDE_REFRESH_COOKIE, "cookie-test-refresh", {
    ...baseOptions,
    httpOnly: true
  });

  return response;
}
