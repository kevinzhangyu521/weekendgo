import { NextResponse } from "next/server";
import { clearQimeideSessionCookies } from "@/lib/auth/server-session-cookies";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const response = new NextResponse(
    `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>已清理登录状态</title>
  </head>
  <body>
    <p>已清理登录状态，请重新登录。</p>
    <script>
      window.localStorage.removeItem("qimeide_auth_email");
      window.localStorage.removeItem("qimeide_is_admin");
    </script>
  </body>
</html>`,
    {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store"
      }
    }
  );

  clearQimeideSessionCookies(response);
  return response;
}
