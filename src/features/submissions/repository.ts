import { createClient } from "@/lib/supabase/server";
import type { SpotSubmission } from "./types";

type SubmissionRow = {
  id: string;
  user_id: string;
  name: string;
  name_zh: string | null;
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
  created_at: string;
};

function normalize(row: SubmissionRow): SpotSubmission {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    nameZh: row.name_zh,
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
    createdAt: row.created_at
  };
}

export async function getPendingSubmissions(): Promise<SpotSubmission[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("spot_submissions")
    .select(
      "id,user_id,name,name_zh,city,city_zh,latitude,longitude,address,scenario,difficulty,safety,distance_km,min_kid_age,has_parking,has_toilet,image_url,description,description_zh,status,review_note,created_at"
    )
    .eq("status", "pending")
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
    .select(
      "id,user_id,name,name_zh,city,city_zh,latitude,longitude,address,scenario,difficulty,safety,distance_km,min_kid_age,has_parking,has_toilet,image_url,description,description_zh,status,review_note,created_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as SubmissionRow[]).map(normalize);
}
