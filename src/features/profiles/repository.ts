import { getCurrentAuth } from "@/lib/auth/current-user";
import type { Scenario } from "@/features/destinations/types";
import type { UserProfile } from "./types";

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

function normalizeScenarios(values: FormDataEntryValue[]) {
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

export async function getMyProfile(): Promise<UserProfile | null> {
  const { supabase, user } = await getCurrentAuth();
  if (!user) return null;

  const { data } = await supabase.from("user_profiles").select("user_id,nickname,avatar_url,bio,home_city,kid_age,preferred_scenarios,receive_notifications").eq("user_id", user.id).maybeSingle();
  const row = data as ProfileRow | null;

  return {
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
}

export async function saveMyProfile(formData: FormData) {
  const { supabase, user } = await getCurrentAuth();

  if (!user) return { ok: false, message: "\u8bf7\u5148\u767b\u5f55\u3002" };

  const nickname = String(formData.get("nickname") ?? "").trim();
  const avatarUrl = String(formData.get("avatar_url") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const homeCity = String(formData.get("home_city") ?? "").trim();
  const kidAgeRaw = String(formData.get("kid_age") ?? "").trim();
  const kidAge = kidAgeRaw ? Number(kidAgeRaw) : null;
  const preferredScenarios = normalizeScenarios(formData.getAll("preferred_scenarios"));
  const receiveNotifications = formData.get("receive_notifications") === "on";

  if (!nickname) {
    return { ok: false, message: "\u8bf7\u586b\u5199\u6635\u79f0\uff0c\u8bc4\u4ef7\u4f1a\u663e\u793a\u8fd9\u4e2a\u540d\u79f0\u3002" };
  }

  if (kidAge !== null && (Number.isNaN(kidAge) || kidAge < 0 || kidAge > 18)) {
    return { ok: false, message: "\u8bf7\u586b\u5199 0-18 \u4e4b\u95f4\u7684\u5b69\u5b50\u5e74\u9f84\u3002" };
  }

  const { error } = await supabase.from("user_profiles").upsert(
    {
      user_id: user.id,
      nickname,
      avatar_url: avatarUrl || null,
      bio: bio || null,
      home_city: homeCity || null,
      kid_age: kidAge,
      preferred_scenarios: preferredScenarios,
      receive_notifications: receiveNotifications,
      updated_at: new Date().toISOString()
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("[profiles] save failed", {
      userId: user.id,
      code: error.code,
      message: error.message,
      details: error.details
    });
    return { ok: false, message: profileWriteErrorMessage(error) };
  }
  return { ok: true, message: "\u8d44\u6599\u5df2\u4fdd\u5b58\u3002" };
}
