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
  let payload: SyncPayload;

  try {
    payload = (await request.json()) as SyncPayload;
  } catch {
    return NextResponse.json({ ok: false, message: "Missing session payload." }, { status: 400 });
  }

  const session = payload.session;

  if (!payload.access_token || !payload.refresh_token || !session) {
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

  const { data, error } = await supabase.auth.getUser(payload.access_token);

  if (error || !data.user || data.user.id !== session.user.id) {
    return NextResponse.json({ ok: false, message: "Invalid session." }, { status: 401 });
  }

  setSupabaseSessionCookies(request, response, session);

  return response;
}
