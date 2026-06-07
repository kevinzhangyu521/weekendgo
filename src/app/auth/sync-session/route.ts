import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { setSupabaseSessionCookies } from "@/lib/supabase/auth-session-cookie";

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
  let payload: SyncPayload;

  try {
    payload = (await request.json()) as SyncPayload;
  } catch {
    return NextResponse.json({ ok: false, message: "Missing session payload." }, { status: 400 });
  }

  if (!payload.access_token || !payload.refresh_token) {
    return NextResponse.json({ ok: false, message: "Missing session tokens." }, { status: 400 });
  }

  const response = NextResponse.json(
    { ok: true },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );

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

  const { data, error } = await supabase.auth.setSession({
    access_token: payload.access_token,
    refresh_token: payload.refresh_token
  });

  if (error || !data.session) {
    return NextResponse.json({ ok: false, message: "Session sync failed." }, { status: 401 });
  }

  setSupabaseSessionCookies(request, response, data.session);
  await supabase.auth.getSession();

  return response;
}
