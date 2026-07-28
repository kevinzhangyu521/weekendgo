import type { Session } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";
import { setQimeideDebugCookie, setQimeideSessionCookies } from "@/lib/auth/server-session-cookies";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BridgePayload = {
  session?: Session;
  access_token?: string;
  refresh_token?: string | null;
};

export async function POST(request: Request) {
  let payload: BridgePayload = {};

  try {
    payload = (await request.json()) as BridgePayload;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const accessToken = payload.session?.access_token ?? payload.access_token;
  const refreshToken = payload.session?.refresh_token ?? payload.refresh_token;
  if (!accessToken) {
    return NextResponse.json({ ok: false, error: "missing_session" }, { status: 400 });
  }

  const supabase = createPublicClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser(accessToken);

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
  setQimeideSessionCookies(response, accessToken, refreshToken);
  setQimeideDebugCookie(response, `bridge-ok:${user.email ?? "unknown"}`);
  response.headers.set("x-debug-session-bridge-mode", "site-session-cookie-only");
  return response;
}
