import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCurrentAuth } from "@/lib/auth/current-user";
import { QIMEIDE_ACCESS_COOKIE, QIMEIDE_EMAIL_COOKIE, QIMEIDE_LOGIN_DEBUG_COOKIE, QIMEIDE_REFRESH_COOKIE, QIMEIDE_SESSION_ID_COOKIE } from "@/lib/auth/server-session-cookies";

type ToggleFavoritePayload = {
  destinationId?: string;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

const text = {
  badRequest: "\u8bf7\u6c42\u683c\u5f0f\u4e0d\u6b63\u786e\u3002",
  missingDestination: "\u7f3a\u5c11\u76ee\u7684\u5730\u4fe1\u606f\u3002",
  signInRequired: "\u8bf7\u5148\u767b\u5f55\u540e\u518d\u6536\u85cf\u3002",
  readFailed: "\u8bfb\u53d6\u6536\u85cf\u72b6\u6001\u5931\u8d25\u3002",
  removeFailed: "\u53d6\u6d88\u6536\u85cf\u5931\u8d25\u3002",
  addFailed: "\u52a0\u5165\u6536\u85cf\u5931\u8d25\u3002",
  removed: "\u5df2\u53d6\u6d88\u6536\u85cf\u3002",
  added: "\u5df2\u52a0\u5165\u6536\u85cf\u3002"
};

async function getAuthDiagnostic() {
  const cookieStore = await cookies();
  return {
    emailCookie: cookieStore.get(QIMEIDE_EMAIL_COOKIE)?.value ?? null,
    hasAccessToken: Boolean(cookieStore.get(QIMEIDE_ACCESS_COOKIE)?.value),
    hasRefreshToken: Boolean(cookieStore.get(QIMEIDE_REFRESH_COOKIE)?.value),
    hasSessionId: Boolean(cookieStore.get(QIMEIDE_SESSION_ID_COOKIE)?.value),
    loginDebug: cookieStore.get(QIMEIDE_LOGIN_DEBUG_COOKIE)?.value ?? null
  };
}

function authDiagnosticMessage(diagnostic: Awaited<ReturnType<typeof getAuthDiagnostic>>) {
  return `${text.signInRequired}\u8bca\u65ad\uff1a\u8d26\u53f7Cookie=${diagnostic.emailCookie ?? "\u672a\u6536\u5230"}\uff0cSessionID=${diagnostic.hasSessionId ? "\u5df2\u6536\u5230" : "\u672a\u6536\u5230"}\uff0cAccessToken=${diagnostic.hasAccessToken ? "\u5df2\u6536\u5230" : "\u672a\u6536\u5230"}\uff0cRefreshToken=${diagnostic.hasRefreshToken ? "\u5df2\u6536\u5230" : "\u672a\u6536\u5230"}\uff0c\u6700\u8fd1\u767b\u5f55=${diagnostic.loginDebug ?? "\u672a\u6536\u5230"}`;
}

export async function POST(request: Request) {
  let payload: ToggleFavoritePayload = {};

  try {
    payload = (await request.json()) as ToggleFavoritePayload;
  } catch {
    return NextResponse.json({ ok: false, message: text.badRequest }, { status: 400 });
  }

  if (!payload.destinationId) {
    return NextResponse.json({ ok: false, message: text.missingDestination }, { status: 400 });
  }

  const { supabase, user } = await getCurrentAuth();

  if (!user) {
    const diagnostic = await getAuthDiagnostic();
    return NextResponse.json({ ok: false, message: authDiagnosticMessage(diagnostic), diagnostic }, { status: 401 });
  }

  const { data: existing, error: existingError } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("destination_id", payload.destinationId)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ ok: false, message: text.readFailed }, { status: 500 });
  }

  if (existing) {
    const { error } = await supabase.from("favorites").delete().eq("id", existing.id);
    if (error) return NextResponse.json({ ok: false, message: text.removeFailed }, { status: 500 });
    return NextResponse.json({ ok: true, isFavorite: false, message: text.removed });
  }

  const { error } = await supabase.from("favorites").insert({
    user_id: user.id,
    destination_id: payload.destinationId
  });

  if (error) return NextResponse.json({ ok: false, message: text.addFailed }, { status: 500 });

  return NextResponse.json({ ok: true, isFavorite: true, message: text.added });
}
