import { NextResponse } from "next/server";
import type { Scenario } from "@/features/destinations/types";
import type { UserProfile } from "@/features/profiles/types";
import { getRequestAuth } from "@/lib/auth/request-auth";

type ProfileRow = {
  user_id: string;
  nickname: string | null;
  avatar_url: string | null;
  home_city: string | null;
  kid_age: number | null;
  preferred_scenarios: Scenario[] | null;
  receive_notifications: boolean | null;
};

const validScenarios = new Set<Scenario>(["camping", "creek", "hiking", "picnic"]);

export const dynamic = "force-dynamic";
export const revalidate = 0;

function normalizeScenarios(values: unknown): Scenario[] {
  if (!Array.isArray(values)) return [];
  return values.map(String).filter((value): value is Scenario => validScenarios.has(value as Scenario));
}

export async function GET(request: Request) {
  const { supabase, user, authSource } = await getRequestAuth(request);
  if (!user) {
    return NextResponse.json({ ok: false, profile: null, authSource, message: "\u8bf7\u5148\u767b\u5f55\u3002" }, { status: 401 });
  }

  const { data } = await supabase
    .from("user_profiles")
    .select("user_id,nickname,avatar_url,home_city,kid_age,preferred_scenarios,receive_notifications")
    .eq("user_id", user.id)
    .maybeSingle();
  const row = data as ProfileRow | null;

  const profile: UserProfile = {
    userId: user.id,
    email: user.email ?? "",
    nickname: row?.nickname ?? "",
    avatarUrl: row?.avatar_url ?? null,
    homeCity: row?.home_city ?? "",
    kidAge: row?.kid_age ?? null,
    preferredScenarios: row?.preferred_scenarios ?? [],
    receiveNotifications: row?.receive_notifications ?? true
  };

  return NextResponse.json({ ok: true, profile, authSource });
}

export async function PUT(request: Request) {
  const { supabase, user, authSource } = await getRequestAuth(request);
  if (!user) {
    return NextResponse.json({ ok: false, authSource, message: "\u8bf7\u5148\u767b\u5f55\u3002" }, { status: 401 });
  }

  const body = (await request.json()) as {
    nickname?: string;
    homeCity?: string;
    kidAge?: number | null;
    preferredScenarios?: string[];
    receiveNotifications?: boolean;
  };

  const kidAge = body.kidAge ?? null;
  const nickname = body.nickname?.trim() ?? "";
  if (!nickname) {
    return NextResponse.json({ ok: false, message: "\u8bf7\u586b\u5199\u6635\u79f0\uff0c\u8bc4\u4ef7\u4f1a\u663e\u793a\u8fd9\u4e2a\u540d\u79f0\u3002" }, { status: 400 });
  }

  if (kidAge !== null && (Number.isNaN(kidAge) || kidAge < 0 || kidAge > 18)) {
    return NextResponse.json({ ok: false, message: "\u8bf7\u586b\u5199 0-18 \u4e4b\u95f4\u7684\u5b69\u5b50\u5e74\u9f84\u3002" }, { status: 400 });
  }

  const { error } = await supabase.from("user_profiles").upsert(
    {
      user_id: user.id,
      nickname,
      home_city: body.homeCity?.trim() || null,
      kid_age: kidAge,
      preferred_scenarios: normalizeScenarios(body.preferredScenarios),
      receive_notifications: Boolean(body.receiveNotifications),
      updated_at: new Date().toISOString()
    },
    { onConflict: "user_id" }
  );

  if (error) {
    return NextResponse.json({ ok: false, message: "\u4fdd\u5b58\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: "\u8d44\u6599\u5df2\u4fdd\u5b58\u3002", authSource });
}
