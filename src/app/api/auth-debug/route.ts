import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  QIMEIDE_ACCESS_COOKIE,
  QIMEIDE_EMAIL_COOKIE,
  QIMEIDE_LOGIN_DEBUG_COOKIE,
  QIMEIDE_REFRESH_COOKIE,
  QIMEIDE_SESSION_ID_COOKIE
} from "@/lib/auth/server-session-cookies";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function hasValue(value: string | undefined) {
  return Boolean(value && value.length > 0);
}

export async function GET() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const host = headerStore.get("host") ?? "unknown";
  const protocol = headerStore.get("x-forwarded-proto") ?? "https";
  const supabase = await createClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  const requestCookies = cookieStore.getAll();
  const hasSupabaseAuthCookie = requestCookies.some((cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("-auth-token"));
  const hasQimeideEmail = Boolean(cookieStore.get(QIMEIDE_EMAIL_COOKIE)?.value);
  const hasQimeideAccessToken = Boolean(cookieStore.get(QIMEIDE_ACCESS_COOKIE)?.value);
  const hasQimeideRefreshToken = Boolean(cookieStore.get(QIMEIDE_REFRESH_COOKIE)?.value);
  const hasQimeideSessionId = Boolean(cookieStore.get(QIMEIDE_SESSION_ID_COOKIE)?.value);
  const hasLoginDebug = Boolean(cookieStore.get(QIMEIDE_LOGIN_DEBUG_COOKIE)?.value);
  const redirectUrl = `${protocol}://${host}/auth/callback`;

  return NextResponse.json(
    {
      ok: true,
      host,
      protocol,
      redirectUrl,
      env: {
        NEXT_PUBLIC_SUPABASE_URL: hasValue(process.env.NEXT_PUBLIC_SUPABASE_URL),
        NEXT_PUBLIC_SUPABASE_ANON_KEY: hasValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        NEXT_PUBLIC_SITE_URL: hasValue(process.env.NEXT_PUBLIC_SITE_URL),
        SITE_URL: hasValue(process.env.SITE_URL)
      },
      cookies: {
        hasSupabaseAuthCookie,
        hasQimeideEmail,
        hasQimeideAccessToken,
        hasQimeideRefreshToken,
        hasQimeideSessionId,
        hasLoginDebug
      },
      readable: {
        "Supabase Auth Cookie": hasSupabaseAuthCookie ? "已收到" : "未收到",
        "账号Cookie": hasQimeideEmail ? "已收到" : "未收到",
        "SessionID": hasQimeideSessionId ? "已收到" : "未收到",
        "AccessToken": hasQimeideAccessToken ? "已收到" : "未收到",
        "RefreshToken": hasQimeideRefreshToken ? "已收到" : "未收到",
        "最近登录": hasLoginDebug ? "已收到" : "未收到",
        "服务端用户": user?.email ?? "未读取到"
      },
      getUser: {
        ok: Boolean(user),
        email: user?.email ?? null,
        error: error?.message ?? null
      }
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
