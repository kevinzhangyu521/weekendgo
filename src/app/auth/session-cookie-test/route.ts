import { NextResponse } from "next/server";
import { QIMEIDE_ACCESS_COOKIE, QIMEIDE_EMAIL_COOKIE, QIMEIDE_REFRESH_COOKIE, getQimeideCookieDomain } from "@/lib/auth/server-session-cookies";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const response = NextResponse.json(
    {
      ok: true,
      message: "\u5df2\u5c1d\u8bd5\u5199\u5165\u7ad9\u5185\u767b\u5f55\u6d4b\u8bd5 Cookie\u3002"
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
