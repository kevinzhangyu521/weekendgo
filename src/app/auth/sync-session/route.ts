import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { setQimeideSessionCookies } from "@/lib/auth/server-session-cookies";

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

type SyncPayload = {
  access_token?: string;
  refresh_token?: string;
};

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let payload: SyncPayload = {};

  try {
    payload = (await request.json()) as SyncPayload;
  } catch {
    return NextResponse.json({ ok: false, message: "登录状态同步失败，请重新登录。" }, { status: 400 });
  }

  if (!payload.access_token || !payload.refresh_token) {
    return NextResponse.json({ ok: false, message: "登录状态缺少必要信息，请重新登录。" }, { status: 400 });
  }

  const cookiesToApply: CookieToSet[] = [];
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        cookiesToApply.push(...cookiesToSet);
      }
    }
  });

  const { data, error } = await supabase.auth.setSession({
    access_token: payload.access_token,
    refresh_token: payload.refresh_token
  });

  if (error || !data.user) {
    return NextResponse.json({ ok: false, message: "登录状态同步失败，请重新登录。" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, email: data.user.email ?? null });
  response.headers.set("Cache-Control", "no-store");
  cookiesToApply.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
  setQimeideSessionCookies(response, {
    access_token: payload.access_token,
    refresh_token: payload.refresh_token
  }, data.user.email ?? "");

  return response;
}
