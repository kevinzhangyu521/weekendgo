import type { Session } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";
import { setQimeideSessionCookies } from "@/lib/auth/server-session-cookies";
import { setSupabaseAuthCookie } from "@/lib/supabase/session-cookie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BridgePayload = {
  session?: Session;
};

export async function POST(request: Request) {
  let payload: BridgePayload = {};

  try {
    payload = (await request.json()) as BridgePayload;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const session = payload.session;
  if (!session?.access_token || !session.refresh_token) {
    return NextResponse.json({ ok: false, error: "missing_session" }, { status: 400 });
  }

  const supabase = createPublicClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser(session.access_token);

  if (error || !user) {
    return NextResponse.json({ ok: false, error: "invalid_session" }, { status: 401 });
  }

  const response = NextResponse.json(
    {
      ok: true,
      email: user.email ?? null
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
  const cookieNames = setSupabaseAuthCookie(response, session);
  setQimeideSessionCookies(response, session.access_token, session.refresh_token);
  response.headers.set("x-debug-session-bridge-cookie-names", cookieNames.join(","));
  response.headers.set("x-debug-session-bridge-has-cookie", cookieNames.length > 0 ? "true" : "false");
  return response;
}
