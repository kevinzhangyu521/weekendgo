import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getRequestAuth } from "@/lib/auth/request-auth";
import { normalizeUserRole, type UserRole } from "@/lib/auth/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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
const authUsersPerPage = 1000;

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

async function listAllAuthUsers(adminClient: SupabaseClient) {
  const users: User[] = [];
  let page = 1;

  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage: authUsersPerPage
    });

    if (error) throw error;

    const nextUsers = data.users ?? [];
    users.push(...nextUsers);

    if (nextUsers.length < authUsersPerPage) break;
    page += 1;
  }

  return users.sort((a, b) => Date.parse(b.created_at ?? "") - Date.parse(a.created_at ?? ""));
}

async function fetchCountRows(dataClient: SupabaseClient, table: string, userIds: string[]) {
  const { data } = await dataClient.from(table).select("user_id").in("user_id", userIds);
  return (data ?? []) as CountRow[];
}

async function fetchEmailRows(dataClient: SupabaseClient, table: string, userIds: string[]) {
  const { data } = await dataClient.from(table).select(emailSelect).in("user_id", userIds).not("user_email", "is", null);
  return (data ?? []) as UserEmailRow[];
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
  let dataClient: SupabaseClient;
  let authUsers: User[];

  try {
    dataClient = createSupabaseAdminClient();
    authUsers = await listAllAuthUsers(dataClient);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown admin client error";
    return NextResponse.json({ ok: false, isAdmin: true, users: [], message: `用户管理服务端配置或读取失败：${message}` }, { status: 500 });
  }

  const userIds = authUsers.map((user) => user.id).filter(Boolean);
  const { data: profileData, error: profileError } =
    userIds.length > 0
      ? await dataClient.from("user_profiles").select(profileSelect).in("user_id", userIds)
      : { data: [], error: null };

  if (profileError) {
    return NextResponse.json({ ok: false, isAdmin: true, users: [], message: `读取用户资料失败：${profileError.message}` }, { status: 500 });
  }

  const profiles = profileData as UserProfileRow[];
  const profileMap = new Map(profiles.map((profile) => [profile.user_id, profile]));
  const [favoriteRows, planRows, submissionRows, feedbackRows, experienceRows, applicationRows, submissionEmailRows, feedbackEmailRows, applicationEmailRows] =
    userIds.length > 0
      ? await Promise.all([
          fetchCountRows(dataClient, "favorites", userIds),
          fetchCountRows(dataClient, "weekend_plans", userIds),
          fetchCountRows(dataClient, "spot_submissions", userIds),
          fetchCountRows(dataClient, "feedbacks", userIds),
          fetchCountRows(dataClient, "family_destination_experiences", userIds),
          fetchCountRows(dataClient, "family_experience_applications", userIds),
          fetchEmailRows(dataClient, "spot_submissions", userIds),
          fetchEmailRows(dataClient, "feedbacks", userIds),
          fetchEmailRows(dataClient, "family_experience_applications", userIds)
        ])
      : [];

  const favoriteCounts = new Map<string, number>();
  const planCounts = new Map<string, number>();
  const submissionCounts = new Map<string, number>();
  const feedbackCounts = new Map<string, number>();
  const experienceCounts = new Map<string, number>();
  const applicationCounts = new Map<string, number>();
  const businessEmails = new Map<string, string>();

  addCount(favoriteCounts, favoriteRows ?? null);
  addCount(planCounts, planRows ?? null);
  addCount(submissionCounts, submissionRows ?? null);
  addCount(feedbackCounts, feedbackRows ?? null);
  addCount(experienceCounts, experienceRows ?? null);
  addCount(applicationCounts, applicationRows ?? null);

  [submissionEmailRows, feedbackEmailRows, applicationEmailRows].forEach((rows) => {
    (rows ?? []).forEach((row) => {
      if (row.user_id && row.user_email && !businessEmails.has(row.user_id)) businessEmails.set(row.user_id, row.user_email);
    });
  });

  const users: AdminUserItem[] = authUsers.map((authUser) => {
    const profile = profileMap.get(authUser.id);
    return {
      id: authUser.id,
      email: authUser.email ?? businessEmails.get(authUser.id) ?? null,
      nickname: profile?.nickname ?? "未设置",
      avatarUrl: profile?.avatar_url ?? null,
      city: profile?.home_city ?? "未设置",
      bio: profile?.bio ?? null,
      role: normalizeUserRole(profile?.role),
      createdAt: profile?.created_at ?? authUser.created_at ?? null,
      counts: {
        favorites: countFor(favoriteCounts, authUser.id),
        plans: countFor(planCounts, authUser.id),
        submissions: countFor(submissionCounts, authUser.id),
        feedbacks: countFor(feedbackCounts, authUser.id),
        experiences: countFor(experienceCounts, authUser.id),
        familyApplications: countFor(applicationCounts, authUser.id)
      }
    };
  });

  return NextResponse.json({
    ok: true,
    isAdmin: true,
    users: applyRole(applySearch(users, q), role),
    authSource: auth.authSource,
    emailSource: "Supabase Authentication"
  });
}
