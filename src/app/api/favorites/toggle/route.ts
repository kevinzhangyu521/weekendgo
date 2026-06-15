import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getRequestAuth } from "@/lib/auth/request-auth";

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

async function getAuthDiagnostic(authSource: string) {
  const cookieStore = await cookies();
  const cookieNames = cookieStore.getAll().map((cookie) => cookie.name).sort();
  return {
    authSource,
    hasSupabaseAuthCookie: cookieNames.some((name) => name.startsWith("sb-") && name.includes("auth-token")),
    cookiesReceived: cookieNames
  };
}

function authDiagnosticMessage(diagnostic: Awaited<ReturnType<typeof getAuthDiagnostic>>) {
  return `${text.signInRequired}\u8bca\u65ad\uff1aSupabase Auth Cookie=${diagnostic.hasSupabaseAuthCookie ? "\u5df2\u6536\u5230" : "\u672a\u6536\u5230"}\uff0cAuthSource=${diagnostic.authSource}`;
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

  const { supabase, user, authSource } = await getRequestAuth(request);

  if (!user) {
    const diagnostic = await getAuthDiagnostic(authSource);
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
    return NextResponse.json({ ok: true, isFavorite: false, message: text.removed, authSource });
  }

  const { error } = await supabase.from("favorites").insert({
    user_id: user.id,
    destination_id: payload.destinationId
  });

  if (error) return NextResponse.json({ ok: false, message: text.addFailed }, { status: 500 });

  return NextResponse.json({ ok: true, isFavorite: true, message: text.added, authSource });
}
