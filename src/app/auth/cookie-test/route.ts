import { NextResponse } from "next/server";
import { QIMEIDE_COOKIE_TEST, getQimeideCookieDomain } from "@/lib/auth/server-session-cookies";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const response = NextResponse.json(
    {
      ok: true,
      message: "已尝试写入测试 Cookie，请刷新 /auth-status 查看。"
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );

  response.cookies.set(QIMEIDE_COOKIE_TEST, "ok", {
    path: "/",
    domain: getQimeideCookieDomain(),
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600
  });

  return response;
}
