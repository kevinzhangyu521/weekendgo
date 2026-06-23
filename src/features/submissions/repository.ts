import { createClient } from "@/lib/supabase/server";
import type { SpotSubmission } from "./types";

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

function normalizeReviewNote(note: string | null, status: SpotSubmission["status"]) {
  const normalized = note?.trim().toLowerCase();

  if (!normalized) return null;
  if (normalized === "rejected") {
    return "\u672a\u901a\u8fc7\u5ba1\u6838\uff0c\u5efa\u8bae\u8865\u5145\u66f4\u6e05\u6670\u7684\u5730\u70b9\u4fe1\u606f\u3001\u5b89\u5168\u63d0\u793a\u6216\u73b0\u573a\u56fe\u7247\u540e\u518d\u6b21\u63d0\u4ea4\u3002";
  }
  if (normalized === "approved") {
    return "\u5ba1\u6838\u5df2\u901a\u8fc7\uff0c\u5730\u70b9\u5df2\u53d1\u5e03\u5230\u76ee\u7684\u5730\u5217\u8868\u3002";
  }
  if (normalized === "needs_changes") {
    return "\u9700\u8981\u4fee\u6539\uff0c\u8bf7\u6309\u7ba1\u7406\u5458\u5907\u6ce8\u5b8c\u5584\u540e\u518d\u6b21\u63d0\u4ea4\u3002";
  }
  if (status === "rejected" && /^[a-z\s._-]+$/.test(normalized)) {
    return "\u672a\u901a\u8fc7\u5ba1\u6838\uff0c\u5efa\u8bae\u8865\u5145\u66f4\u5b8c\u6574\u7684\u5730\u70b9\u4fe1\u606f\u540e\u518d\u6b21\u63d0\u4ea4\u3002";
  }

  return note;
}

function normalize(row: SubmissionRow): SpotSubmission {
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
    imageUrl: row.image_url,
    description: row.description,
    descriptionZh: row.description_zh,
    status: row.status,
    reviewNote: normalizeReviewNote(row.review_note, row.status),
    publishedDestinationId: row.published_destination_id,
    allowResubmit: Boolean(row.allow_resubmit),
    isLocked: Boolean(row.is_locked),
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

const submissionSelect =
  "id,user_id,user_email,user_name,user_role,contact,name,name_zh,province,province_zh,city,city_zh,latitude,longitude,address,scenario,difficulty,safety,distance_km,min_kid_age,has_parking,has_toilet,image_url,description,description_zh,status,review_note,published_destination_id,allow_resubmit,is_locked,deleted_at,created_at,updated_at";

export async function getPendingSubmissions(): Promise<SpotSubmission[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("spot_submissions")
    .select(submissionSelect)
    .eq("status", "pending")
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return (data as SubmissionRow[]).map(normalize);
}

export async function getMySubmissions(): Promise<SpotSubmission[]> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("spot_submissions")
    .select(submissionSelect)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as SubmissionRow[]).map(normalize);
}

export async function getEditableSubmission(id: string): Promise<SpotSubmission | null> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("spot_submissions")
    .select(submissionSelect)
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) return null;
  const item = normalize(data as SubmissionRow);
  if (item.isLocked || item.status === "approved") return null;
  return item;
}

export async function purgeExpiredDeletedSubmissions() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return;

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  await supabase.from("spot_submissions").delete().eq("user_id", user.id).not("deleted_at", "is", null).lte("deleted_at", cutoff);
}
