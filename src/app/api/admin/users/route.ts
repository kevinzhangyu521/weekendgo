import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getRequestAuth } from "@/lib/auth/request-auth";
import { normalizeUserRole, type UserRole } from "@/lib/auth/roles";

type UserProfileRow = {
  user_id: string;
  nickname: string | null;
  avatar_url: string | null;
  bio: string | null;
  home_city: string | null;
  role: string | null;
  created_at: string | null;
};

type UserEmailRow = {
  user_id: string | null;
  user_email: string | null;
};

type CountRow = {
  user_id: string | null;
};

type AdminUserItem = {
  id: string;
  email: string | null;
  nickname: string | null;
  avatarUrl: string | null;
  city: string | null;
  bio: string | null;
  role: UserRole;
  createdAt: string | null;
  counts: {
    favorites: number;
    plans: number;
    submissions: number;
    feedbacks: number;
    experiences: number;
    familyApplications: number;
  };
};

const profileSelect = "user_id,nickname,avatar_url,bio,home_city,role,created_at";
const emailSelect = "user_id,user_email";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  return createSupabaseClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

function addCount(target: Map<string, number>, rows: CountRow[] | null) {
  (rows ?? []).forEach((row) => {
    if (!row.user_id) return;
    target.set(row.user_id, (target.get(row.user_id) ?? 0) + 1);
  });
}

function countFor(map: Map<string, number>, userId: string) {
  return map.get(userId) ?? 0;
}

function applySearch(items: AdminUserItem[], q: string) {
  if (!q) return items;
  const keyword = q.toLowerCase();
  return items.filter((item) =>
    [item.id, item.email ?? "", item.nickname ?? "", item.city ?? "", item.bio ?? "", item.role]
      .join(" ")
      .toLowerCase()
      .includes(keyword)
  );
}

function applyRole(items: AdminUserItem[], role: string) {
  if (!role) return items;
  return items.filter((item) => item.role === role);
}

export async function GET(request: Request) {
  const auth = await getRequestAuth(request);
  if (!auth.user) {
    return NextResponse.json({ ok: false, isAdmin: false, users: [], message: "请先登录管理员账号。" }, { status: 401 });
  }
  if (!auth.isAdmin) {
    return NextResponse.json({ ok: false, isAdmin: false, users: [], message: "你没有管理员权限。" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const role = searchParams.get("role")?.trim() ?? "";
  const dataClient = createServiceClient() ?? auth.supabase;

  const { data: profileData, error: profileError } = await dataClient
    .from("user_profiles")
    .select(profileSelect)
    .order("created_at", { ascending: false })
    .limit(300);

  if (profileError || !profileData) {
    return NextResponse.json({ ok: false, isAdmin: true, users: [], message: `读取用户资料失败：${profileError?.message ?? "没有返回数据"}` }, { status: 500 });
  }

  const profiles = profileData as UserProfileRow[];
  const userIds = profiles.map((profile) => profile.user_id).filter(Boolean);
  const [favoriteResult, planResult, submissionResult, feedbackResult, experienceResult, applicationResult, submissionEmailResult, feedbackEmailResult, applicationEmailResult] =
    userIds.length > 0
      ? await Promise.all([
          dataClient.from("favorites").select("user_id").in("user_id", userIds),
          dataClient.from("weekend_plans").select("user_id").in("user_id", userIds),
          dataClient.from("spot_submissions").select("user_id").in("user_id", userIds),
          dataClient.from("feedbacks").select("user_id").in("user_id", userIds),
          dataClient.from("family_destination_experiences").select("user_id").in("user_id", userIds),
          dataClient.from("family_experience_applications").select("user_id").in("user_id", userIds),
          dataClient.from("spot_submissions").select(emailSelect).in("user_id", userIds).not("user_email", "is", null),
          dataClient.from("feedbacks").select(emailSelect).in("user_id", userIds).not("user_email", "is", null),
          dataClient.from("family_experience_applications").select(emailSelect).in("user_id", userIds).not("user_email", "is", null)
        ])
      : [];

  const favoriteCounts = new Map<string, number>();
  const planCounts = new Map<string, number>();
  const submissionCounts = new Map<string, number>();
  const feedbackCounts = new Map<string, number>();
  const experienceCounts = new Map<string, number>();
  const applicationCounts = new Map<string, number>();
  const emails = new Map<string, string>();

  addCount(favoriteCounts, (favoriteResult?.data ?? []) as CountRow[]);
  addCount(planCounts, (planResult?.data ?? []) as CountRow[]);
  addCount(submissionCounts, (submissionResult?.data ?? []) as CountRow[]);
  addCount(feedbackCounts, (feedbackResult?.data ?? []) as CountRow[]);
  addCount(experienceCounts, (experienceResult?.data ?? []) as CountRow[]);
  addCount(applicationCounts, (applicationResult?.data ?? []) as CountRow[]);

  [submissionEmailResult, feedbackEmailResult, applicationEmailResult].forEach((result) => {
    ((result?.data ?? []) as UserEmailRow[]).forEach((row) => {
      if (row.user_id && row.user_email && !emails.has(row.user_id)) emails.set(row.user_id, row.user_email);
    });
  });

  const users: AdminUserItem[] = profiles.map((profile) => ({
    id: profile.user_id,
    email: emails.get(profile.user_id) ?? null,
    nickname: profile.nickname,
    avatarUrl: profile.avatar_url,
    city: profile.home_city,
    bio: profile.bio,
    role: normalizeUserRole(profile.role),
    createdAt: profile.created_at,
    counts: {
      favorites: countFor(favoriteCounts, profile.user_id),
      plans: countFor(planCounts, profile.user_id),
      submissions: countFor(submissionCounts, profile.user_id),
      feedbacks: countFor(feedbackCounts, profile.user_id),
      experiences: countFor(experienceCounts, profile.user_id),
      familyApplications: countFor(applicationCounts, profile.user_id)
    }
  }));

  return NextResponse.json({
    ok: true,
    isAdmin: true,
    users: applyRole(applySearch(users, q), role),
    authSource: auth.authSource,
    emailSource: "业务表用户邮箱快照"
  });
}
