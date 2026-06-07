import { NextResponse, type NextRequest } from "next/server";
import type { Session } from "@supabase/supabase-js";
import { setSupabaseSessionCookies } from "@/lib/supabase/auth-session-cookie";

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

  setSupabaseSessionCookies(request, response, session);

  return response;
}
