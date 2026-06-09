import { NextResponse } from "next/server";
import { clearQimeideSessionCookies } from "@/lib/auth/server-session-cookies";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const response = NextResponse.json(
    {
      ok: true,
      message: "\u5df2\u6e05\u7406\u7ad9\u5185\u767b\u5f55 Cookie\uff0c\u8bf7\u91cd\u65b0\u767b\u5f55\u3002"
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );

  clearQimeideSessionCookies(response);
  return response;
}
