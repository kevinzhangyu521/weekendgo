import { NextResponse } from "next/server";
import type { SpotSubmission } from "@/features/submissions/types";
import { getRequestAuth } from "@/lib/auth/request-auth";

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
  is_locked: boolean | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string | null;
};

const submissionSelect =
  "id,user_id,user_email,user_name,user_role,contact,name,name_zh,province,province_zh,city,city_zh,latitude,longitude,address,scenario,difficulty,safety,distance_km,min_kid_age,has_parking,has_toilet,image_url,description,description_zh,status,review_note,is_locked,deleted_at,created_at,updated_at";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
    reviewNote: row.review_note,
    isLocked: Boolean(row.is_locked),
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function GET(request: Request) {
  const { supabase, user, authSource } = await getRequestAuth(request);
  if (!user) {
    return NextResponse.json({ ok: false, submissions: [], notifications: [], authSource, message: "\u8bf7\u5148\u767b\u5f55\u3002" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  await supabase.from("spot_submissions").delete().eq("user_id", user.id).not("deleted_at", "is", null).lte("deleted_at", cutoff);

  const { data, error } = await supabase.from("spot_submissions").select(submissionSelect).eq("user_id", user.id).order("created_at", { ascending: false });
  const { data: notifications } = await supabase
    .from("user_notifications")
    .select("id,type,title,body,href,read_at,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(3);

  if (error || !data) {
    return NextResponse.json({ ok: false, submissions: [], notifications: [], message: "\u8bfb\u53d6\u6295\u7a3f\u5931\u8d25\u3002" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, submissions: (data as SubmissionRow[]).map(normalize), notifications: notifications ?? [], authSource });
}
