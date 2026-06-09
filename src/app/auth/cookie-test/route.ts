import { NextResponse } from "next/server";

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

  response.cookies.set("qimeide_cookie_test", "ok", {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600
  });

  return response;
}
