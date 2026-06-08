import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Session } from "@supabase/supabase-js";
import { setSupabaseSessionCookies } from "@/lib/supabase/auth-session-cookie";

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

type SyncPayload = {
  access_token?: string;
  refresh_token?: string;
  session?: Session;
};

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let payload: SyncPayload = {};

  try {
    payload = (await request.json()) as SyncPayload;
  } catch {
    return NextResponse.json({ ok: false, message: "登录状态同步失败，请重新登录。" }, { status: 400 });
  }

  if (!payload.access_token || !payload.refresh_token || !payload.session) {
    return NextResponse.json({ ok: false, message: "登录状态缺少必要信息，请重新登录。" }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  response.headers.set("Cache-Control", "no-store");

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookieOptions: {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });

  const { data, error } = await supabase.auth.getUser(payload.access_token);

  if (error || !data.user) {
    return NextResponse.json({ ok: false, message: "登录状态同步失败，请重新登录。" }, { status: 401 });
  }

  setSupabaseSessionCookies(request, response, payload.session);
  response.cookies.set("qimeide_auth_email", data.user.email ?? payload.session.user.email ?? "", {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 400 * 24 * 60 * 60
  });

  return response;
}
