import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import {
  familyDestinationExperienceAdminSelectFields,
  normalizeFamilyDestinationExperience,
  type FamilyDestinationExperienceRow
} from "@/features/family-destination-experiences/mapper";
import { familyExperienceSelectFields, normalizeFamilyExperienceApplication, type FamilyExperienceApplicationRow } from "@/features/family-experience/mapper";
import type { FeedbackStatus, FeedbackType } from "@/features/feedback/types";
import type { PlanSummary } from "@/features/plans/types";
import type { SpotSubmission } from "@/features/submissions/types";
import { getRequestAuth } from "@/lib/auth/request-auth";
import { normalizeUserRole } from "@/lib/auth/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{
    userId: string;
  }>;
};

type UserProfileRow = {
  user_id: string;
  nickname: string | null;
  avatar_url: string | null;
  bio: string | null;
  home_city: string | null;
  role: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type FavoriteRow = {
  id: string;
  user_id: string;
  destination_id: string;
  created_at: string;
};

type DestinationNameRow = {
  id: string;
  name: string | null;
  name_zh: string | null;
};

type PlanRow = {
  id: string;
  title: string;
  plan_date: string;
  status: PlanSummary["status"];
  is_public: boolean;
  share_slug: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type PlanItemCountRow = {
  plan_id: string;
};

type SubmissionRow = {
  id: string;
  user_id: string;
  user_email: string | null;
  user_name: string | null;
  user_role: string | null;
  contact: string | null;
  name: string;
  name_zh: string | null;
  province: string | null;
  province_zh: string | null;
  city: string;
  city_zh: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  scenario: SpotSubmission["scenario"];
  difficulty: SpotSubmission["difficulty"];
  safety: SpotSubmission["safety"];
  distance_km: number;
  min_kid_age: number;
  has_parking: boolean;
  has_toilet: boolean;
  ticket_price: string | null;
  image_url: string | null;
  description: string;
  description_zh: string | null;
  status: SpotSubmission["status"];
  review_note: string | null;
  published_destination_id: string | null;
  allow_resubmit: boolean | null;
  is_locked: boolean | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string | null;
};

type FeedbackRow = {
  id: string;
  feedback_no: string | null;
  user_id: string | null;
  user_email: string | null;
  user_name: string | null;
  user_role: string | null;
  type: FeedbackType;
  content: string;
  contact: string | null;
  page_url: string | null;
  device_type: string | null;
  user_agent: string | null;
  status: FeedbackStatus;
  admin_note: string | null;
  admin_reply: string | null;
  replied_at: string | null;
  status_changed_at: string | null;
  created_at: string;
  updated_at: string;
};

const profileSelect = "user_id,nickname,avatar_url,bio,home_city,role,created_at,updated_at";
const favoriteSelect = "id,user_id,destination_id,created_at";
const destinationNameSelect = "id,name,name_zh";
const planSelect = "id,title,plan_date,status,is_public,share_slug,created_at,updated_at";
const submissionSelect =
  "id,user_id,user_email,user_name,user_role,contact,name,name_zh,province,province_zh,city,city_zh,latitude,longitude,address,scenario,difficulty,safety,distance_km,min_kid_age,has_parking,has_toilet,ticket_price,image_url,description,description_zh,status,review_note,published_destination_id,allow_resubmit,is_locked,deleted_at,created_at,updated_at";
const feedbackSelect =
  "id,feedback_no,user_id,user_email,user_name,user_role,type,content,contact,page_url,device_type,user_agent,status,admin_note,admin_reply,replied_at,status_changed_at,created_at,updated_at";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function normalizeAuthUser(user: User) {
  return {
    id: user.id,
    email: user.email ?? null,
    phone: user.phone ?? null,
    createdAt: user.created_at ?? null,
    updatedAt: user.updated_at ?? null,
    lastSignInAt: user.last_sign_in_at ?? null,
    emailConfirmedAt: user.email_confirmed_at ?? null,
    phoneConfirmedAt: user.phone_confirmed_at ?? null
  };
}

function normalizeProfile(profile: UserProfileRow | null) {
  if (!profile) {
    return {
      userId: null,
      nickname: "未设置",
      avatarUrl: null,
      city: "未设置",
      bio: null,
      role: "user",
      createdAt: null,
      updatedAt: null,
      exists: false
    };
  }

  return {
    userId: profile.user_id,
    nickname: profile.nickname ?? "未设置",
    avatarUrl: profile.avatar_url,
    city: profile.home_city ?? "未设置",
    bio: profile.bio,
    role: normalizeUserRole(profile.role),
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
    exists: true
  };
}

function normalizeSubmission(row: SubmissionRow): SpotSubmission {
  return {
    id: row.id,
    userId: row.user_id,
    userEmail: row.user_email,
    userName: row.user_name,
    userRole: row.user_role,
    contact: row.contact,
    name: row.name,
    nameZh: row.name_zh,
    province: row.province,
    provinceZh: row.province_zh,
    city: row.city,
    cityZh: row.city_zh,
    latitude: row.latitude,
    longitude: row.longitude,
    address: row.address,
    scenario: row.scenario,
    difficulty: row.difficulty,
    safety: row.safety,
    distanceKm: row.distance_km,
    minKidAge: row.min_kid_age,
    hasParking: row.has_parking,
    hasToilet: row.has_toilet,
    ticketPrice: row.ticket_price,
    imageUrl: row.image_url,
    description: row.description,
    descriptionZh: row.description_zh,
    status: row.status,
    reviewNote: row.review_note,
    publishedDestinationId: row.published_destination_id,
    allowResubmit: Boolean(row.allow_resubmit),
    isLocked: Boolean(row.is_locked),
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function normalizeFeedback(row: FeedbackRow) {
  return {
    id: row.id,
    feedbackNo: row.feedback_no,
    userId: row.user_id,
    userEmail: row.user_email,
    userName: row.user_name,
    userRole: row.user_role,
    type: row.type,
    content: row.content,
    contact: row.contact,
    pageUrl: row.page_url,
    deviceType: row.device_type,
    userAgent: row.user_agent,
    status: row.status,
    adminNote: row.admin_note,
    adminReply: row.admin_reply,
    repliedAt: row.replied_at,
    statusChangedAt: row.status_changed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function countPlanItems(rows: PlanItemCountRow[] | null) {
  const countMap = new Map<string, number>();
  (rows ?? []).forEach((row) => {
    countMap.set(row.plan_id, (countMap.get(row.plan_id) ?? 0) + 1);
  });
  return countMap;
}

function destinationNameMap(rows: DestinationNameRow[] | null) {
  return new Map((rows ?? []).map((destination) => [destination.id, destination]));
}

async function getDestinationNames(adminClient: ReturnType<typeof createSupabaseAdminClient>, destinationIds: string[]) {
  if (destinationIds.length === 0) return new Map<string, DestinationNameRow>();
  const { data } = await adminClient.from("destinations").select(destinationNameSelect).in("id", destinationIds);
  return destinationNameMap((data ?? []) as DestinationNameRow[]);
}

export async function GET(request: Request, context: RouteContext) {
  const auth = await getRequestAuth(request);
  if (!auth.user) {
    return NextResponse.json({ ok: false, message: "请先登录管理员账号。" }, { status: 401 });
  }
  if (!auth.isAdmin) {
    return NextResponse.json({ ok: false, message: "你没有管理员权限。" }, { status: 403 });
  }

  const { userId } = await context.params;
  if (!userId) {
    return NextResponse.json({ ok: false, message: "缺少用户 ID。" }, { status: 400 });
  }

  let adminClient: ReturnType<typeof createSupabaseAdminClient>;
  let authUser: User;

  try {
    adminClient = createSupabaseAdminClient();
    const { data, error } = await adminClient.auth.admin.getUserById(userId);
    if (error) return NextResponse.json({ ok: false, message: `读取用户失败：${error.message}` }, { status: 500 });
    if (!data.user) return NextResponse.json({ ok: false, message: "用户不存在。" }, { status: 404 });
    authUser = data.user;
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知服务端配置错误";
    return NextResponse.json({ ok: false, message: `用户管理服务端配置或读取失败：${message}` }, { status: 500 });
  }

  const [
    profileResult,
    favoritesResult,
    plansResult,
    submissionsResult,
    feedbacksResult,
    destinationExperiencesResult,
    familyApplicationsResult
  ] = await Promise.all([
    adminClient.from("user_profiles").select(profileSelect).eq("user_id", userId).maybeSingle(),
    adminClient.from("favorites").select(favoriteSelect).eq("user_id", userId).order("created_at", { ascending: false }),
    adminClient.from("weekend_plans").select(planSelect).eq("user_id", userId).order("plan_date", { ascending: false }),
    adminClient.from("spot_submissions").select(submissionSelect).eq("user_id", userId).order("created_at", { ascending: false }),
    adminClient.from("feedbacks").select(feedbackSelect).eq("user_id", userId).order("created_at", { ascending: false }),
    adminClient
      .from("family_destination_experiences")
      .select(familyDestinationExperienceAdminSelectFields)
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    adminClient
      .from("family_experience_applications")
      .select(familyExperienceSelectFields)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
  ]);

  const firstError = [
    profileResult.error,
    favoritesResult.error,
    plansResult.error,
    submissionsResult.error,
    feedbacksResult.error,
    destinationExperiencesResult.error,
    familyApplicationsResult.error
  ].find(Boolean);

  if (firstError) {
    return NextResponse.json({ ok: false, message: `读取用户详情失败：${firstError.message}` }, { status: 500 });
  }

  const favorites = (favoritesResult.data ?? []) as FavoriteRow[];
  const plans = (plansResult.data ?? []) as PlanRow[];
  const planIds = plans.map((plan) => plan.id);
  const favoriteDestinationIds = favorites.map((favorite) => favorite.destination_id).filter(Boolean);

  const [favoriteDestinationNames, planItemRows] = await Promise.all([
    getDestinationNames(adminClient, favoriteDestinationIds),
    planIds.length > 0 ? adminClient.from("plan_items").select("plan_id").in("plan_id", planIds) : Promise.resolve({ data: [], error: null })
  ]);

  if (planItemRows.error) {
    return NextResponse.json({ ok: false, message: `读取计划内容数量失败：${planItemRows.error.message}` }, { status: 500 });
  }

  const planItemCountMap = countPlanItems((planItemRows.data ?? []) as PlanItemCountRow[]);
  const normalizedFavorites = favorites.map((favorite) => {
    const destination = favoriteDestinationNames.get(favorite.destination_id);
    return {
      id: favorite.id,
      userId: favorite.user_id,
      destinationId: favorite.destination_id,
      destinationName: destination?.name ?? null,
      destinationNameZh: destination?.name_zh ?? null,
      createdAt: favorite.created_at
    };
  });

  const normalizedPlans: PlanSummary[] = plans.map((plan) => ({
    id: plan.id,
    title: plan.title,
    planDate: plan.plan_date,
    status: plan.status,
    isPublic: plan.is_public,
    shareSlug: plan.share_slug,
    itemCount: planItemCountMap.get(plan.id) ?? 0
  }));

  const submissions = ((submissionsResult.data ?? []) as SubmissionRow[]).map(normalizeSubmission);
  const feedbacks = ((feedbacksResult.data ?? []) as FeedbackRow[]).map(normalizeFeedback);
  const destinationExperiences = ((destinationExperiencesResult.data ?? []) as FamilyDestinationExperienceRow[]).map(normalizeFamilyDestinationExperience);
  const familyApplications = ((familyApplicationsResult.data ?? []) as FamilyExperienceApplicationRow[]).map(normalizeFamilyExperienceApplication);

  return NextResponse.json({
    ok: true,
    user: normalizeAuthUser(authUser),
    profile: normalizeProfile(profileResult.data as UserProfileRow | null),
    counts: {
      favorites: normalizedFavorites.length,
      plans: normalizedPlans.length,
      submissions: submissions.length,
      feedbacks: feedbacks.length,
      experiences: destinationExperiences.length,
      familyApplications: familyApplications.length
    },
    activity: {
      favorites: normalizedFavorites,
      plans: normalizedPlans,
      submissions,
      feedbacks,
      destinationExperiences,
      familyApplications
    },
    authSource: auth.authSource
  });
}
