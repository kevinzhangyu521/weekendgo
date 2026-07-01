import { NextResponse } from "next/server";
import type { Scenario } from "@/features/destinations/types";
import type { UserProfile } from "@/features/profiles/types";
import { getRequestAuth } from "@/lib/auth/request-auth";

type ProfileRow = {
  user_id: string;
  nickname: string | null;
  avatar_url: string | null;
  bio: string | null;
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

function profileWriteErrorMessage(error: { message?: string; code?: string; details?: string | null }) {
  const detail = [error.code, error.message, error.details].filter(Boolean).join(" ");
  if (detail.includes("bio") || detail.includes("avatar_url")) {
    return "资料表缺少头像或个人简介字段，请先执行最新数据库迁移后再保存。";
  }
  if (detail.includes("row-level security") || detail.includes("RLS")) {
    return "资料保存被数据库权限拦截，请检查 user_profiles 的 RLS 策略。";
  }
  return error.message ? `保存失败：${error.message}` : "保存失败，请稍后再试。";
}

export async function GET(request: Request) {
  const { supabase, user, authSource } = await getRequestAuth(request);
  if (!user) {
    return NextResponse.json({ ok: false, profile: null, authSource, message: "\u8bf7\u5148\u767b\u5f55\u3002" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .select("user_id,nickname,avatar_url,bio,home_city,kid_age,preferred_scenarios,receive_notifications")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[profile/me] read failed", {
      userId: user.id,
      authSource,
      code: error.code,
      message: error.message,
      details: error.details
    });
    return NextResponse.json({ ok: false, profile: null, authSource, message: `读取资料失败：${error.message}` }, { status: 500 });
  }

  const row = data as ProfileRow | null;

  const profile: UserProfile = {
    userId: user.id,
    email: user.email ?? "",
    nickname: row?.nickname ?? "",
    avatarUrl: row?.avatar_url ?? null,
    bio: row?.bio ?? "",
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
    avatarUrl?: string | null;
    bio?: string;
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
      avatar_url: body.avatarUrl?.trim() || null,
      bio: body.bio?.trim() || null,
      home_city: body.homeCity?.trim() || null,
      kid_age: kidAge,
      preferred_scenarios: normalizeScenarios(body.preferredScenarios),
      receive_notifications: Boolean(body.receiveNotifications),
      updated_at: new Date().toISOString()
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("[profile/me] save failed", {
      userId: user.id,
      authSource,
      code: error.code,
      message: error.message,
      details: error.details
    });
    return NextResponse.json({ ok: false, authSource, message: profileWriteErrorMessage(error) }, { status: 500 });
  }

  const profile: UserProfile = {
    userId: user.id,
    email: user.email ?? "",
    nickname,
    avatarUrl: body.avatarUrl?.trim() || null,
    bio: body.bio?.trim() ?? "",
    homeCity: body.homeCity?.trim() ?? "",
    kidAge,
    preferredScenarios: normalizeScenarios(body.preferredScenarios),
    receiveNotifications: Boolean(body.receiveNotifications)
  };

  return NextResponse.json({ ok: true, message: "\u8d44\u6599\u5df2\u4fdd\u5b58\u3002", profile, authSource });
}
