import type { DestinationItem, DestinationPhoto } from "@/features/destinations/types";
import { requireAdmin } from "./permissions";

type DestinationRow = {
  id: string;
  external_id: string | null;
  name: string;
  name_zh: string | null;
  province: string | null;
  province_zh: string | null;
  city: string | null;
  city_zh: string | null;
  address: string | null;
  opening_hours: string | null;
  latitude: number | null;
  longitude: number | null;
  scenario: DestinationItem["scenario"] | null;
  distance_km: number | null;
  difficulty: DestinationItem["difficulty"] | null;
  safety: DestinationItem["safety"] | null;
  rating: number | null;
  has_parking: boolean | null;
  has_toilet: boolean | null;
  min_kid_age: number | null;
  suitable_age_min: number | null;
  suitable_age_max: number | null;
  suggested_duration: string | null;
  family_budget: string | null;
  reservation_required: boolean | null;
  parking_detail: string | null;
  toilet_detail: string | null;
  stroller_friendly: boolean | null;
  pet_friendly: boolean | null;
  best_time: string | null;
  ticket_price: string | null;
  image: string | null;
  description: string | null;
  description_zh: string | null;
  editor_recommendation: string | null;
  family_tips: string | null;
  avoid_pitfalls: string | null;
  is_active: boolean | null;
  updated_at: string | null;
};

export type AdminDestination = DestinationItem & {
  externalId: string | null;
  updatedAt: string | null;
  source: string;
  isActive: boolean;
  photos?: DestinationPhoto[];
};

const selectFields =
  "id,external_id,name,name_zh,province,province_zh,city,city_zh,address,opening_hours,latitude,longitude,scenario,distance_km,difficulty,safety,rating,has_parking,has_toilet,min_kid_age,suitable_age_min,suitable_age_max,suggested_duration,family_budget,reservation_required,parking_detail,toilet_detail,stroller_friendly,pet_friendly,best_time,ticket_price,image,description,description_zh,editor_recommendation,family_tips,avoid_pitfalls,is_active,updated_at";

function normalize(row: DestinationRow): AdminDestination | null {
  if (!row.id || !row.name || !row.scenario || !row.difficulty || !row.safety) return null;

  return {
    id: row.id,
    externalId: row.external_id,
    source: row.external_id?.startsWith("submission-") ? "\u7528\u6237\u6295\u7a3f" : "\u6279\u91cf\u5bfc\u5165/\u7cfb\u7edf",
    name: row.name,
    nameZh: row.name_zh,
    province: row.province,
    provinceZh: row.province_zh,
    city: row.city ?? "",
    cityZh: row.city_zh,
    address: row.address,
    openingHours: row.opening_hours,
    latitude: row.latitude ?? 0,
    longitude: row.longitude ?? 0,
    scenario: row.scenario,
    distanceKm: row.distance_km ?? 0,
    difficulty: row.difficulty,
    safety: row.safety,
    rating: row.rating ?? 0,
    hasParking: row.has_parking ?? false,
    hasToilet: row.has_toilet ?? false,
    minKidAge: row.min_kid_age ?? 0,
    suitableAgeMin: row.suitable_age_min,
    suitableAgeMax: row.suitable_age_max,
    suggestedDuration: row.suggested_duration,
    familyBudget: row.family_budget,
    reservationRequired: row.reservation_required ?? false,
    parkingDetail: row.parking_detail,
    toiletDetail: row.toilet_detail,
    strollerFriendly: row.stroller_friendly,
    petFriendly: row.pet_friendly,
    bestTime: row.best_time,
    ticketPrice: row.ticket_price,
    image: row.image ?? "",
    description: row.description ?? "",
    descriptionZh: row.description_zh,
    editorRecommendation: row.editor_recommendation,
    familyTips: row.family_tips,
    avoidPitfalls: row.avoid_pitfalls,
    isActive: row.is_active ?? true,
    updatedAt: row.updated_at
  };
}

export async function getAdminDestinations(query = "") {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return null;

  let request = supabase.from("destinations").select(selectFields).order("updated_at", { ascending: false });
  const keyword = query.trim();
  if (keyword) {
    request = request.or(`name.ilike.%${keyword}%,name_zh.ilike.%${keyword}%,province.ilike.%${keyword}%,province_zh.ilike.%${keyword}%,city.ilike.%${keyword}%,city_zh.ilike.%${keyword}%`);
  }

  const { data, error } = await request.limit(200);
  if (error || !data) return [];
  return (data as DestinationRow[]).map(normalize).filter((item): item is AdminDestination => item !== null);
}

export async function getAdminDestinationById(id: string) {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return null;

  const { data, error } = await supabase.from("destinations").select(selectFields).eq("id", id).maybeSingle();
  if (error || !data) return null;
  return normalize(data as DestinationRow);
}
