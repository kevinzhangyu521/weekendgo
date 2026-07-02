import { destinationMockData } from "./mock-data";
import { filterDestinations } from "./filter";
import type { DestinationFilters, DestinationItem, DestinationPhoto } from "./types";
import { getCurrentAuth } from "@/lib/auth/current-user";
import { createPublicClient } from "@/lib/supabase/public";
import { unstable_cache } from "next/cache";

type DestinationRow = {
  id: string;
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
  featured?: boolean | null;
  is_featured?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type DestinationPhotoRow = {
  id: string;
  destination_id: string;
  image_url: string;
  category: DestinationPhoto["category"] | null;
  alt_text: string | null;
  is_cover: boolean | null;
  sort_order: number | null;
  created_at: string | null;
  updated_at: string | null;
};

function hasSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function normalizeRow(row: DestinationRow): DestinationItem | null {
  if (!row.id || !row.name || !row.scenario || !row.difficulty || !row.safety) return null;

  return {
    id: row.id,
    name: row.name,
    nameZh: row.name_zh,
    province: row.province,
    provinceZh: row.province_zh,
    city: row.city ?? "Unknown",
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
    featured: row.featured ?? row.is_featured ?? false,
    createdAt: row.created_at ?? row.updated_at ?? null,
    updatedAt: row.updated_at ?? null
  };
}

function normalizePhoto(row: DestinationPhotoRow): DestinationPhoto {
  return {
    id: row.id,
    destinationId: row.destination_id,
    imageUrl: row.image_url,
    category: row.category ?? "gallery",
    altText: row.alt_text,
    isCover: row.is_cover ?? false,
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

const baseDestinationSelectFields =
  "id,name,name_zh,province,province_zh,city,city_zh,address,opening_hours,latitude,longitude,scenario,distance_km,difficulty,safety,rating,has_parking,has_toilet,min_kid_age,suitable_age_min,suitable_age_max,suggested_duration,family_budget,reservation_required,parking_detail,toilet_detail,stroller_friendly,pet_friendly,best_time,ticket_price,image,description,description_zh,editor_recommendation,family_tips,avoid_pitfalls,is_active";

const publicDestinationSelectFields =
  `${baseDestinationSelectFields},created_at,updated_at`;

const destinationSelectFields = baseDestinationSelectFields;

async function fetchPublicSupabaseDestinations(): Promise<DestinationItem[] | null> {
  if (!hasSupabaseEnv()) return null;

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("destinations")
      .select(publicDestinationSelectFields)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(120);

    if (error || !data) {
      const fallback = await supabase
        .from("destinations")
        .select(baseDestinationSelectFields)
        .eq("is_active", true)
        .order("rating", { ascending: false })
        .limit(120);

      if (fallback.error || !fallback.data) return null;

      return (fallback.data as DestinationRow[]).map(normalizeRow).filter((item): item is DestinationItem => item !== null);
    }

    return (data as DestinationRow[]).map(normalizeRow).filter((item): item is DestinationItem => item !== null);
  } catch {
    return null;
  }
}

const getCachedPublicDestinations = unstable_cache(
  async () => fetchPublicSupabaseDestinations(),
  ["public-destinations-v2"],
  {
    revalidate: 300,
    tags: ["destinations"]
  }
);

export async function getAllDestinations(): Promise<DestinationItem[]> {
  const fromSupabase = await getCachedPublicDestinations();
  if (fromSupabase && fromSupabase.length > 0) return fromSupabase;
  return destinationMockData;
}

export async function getPublishedDestinations(): Promise<DestinationItem[]> {
  return (await getCachedPublicDestinations()) ?? [];
}

type HomeRecommendationRow = {
  destination_id: string | null;
  section_type: "today_pick" | "more_explore" | string;
  sort_order: number | null;
  recommendation: string | null;
  custom_title: string | null;
  custom_cover_image: string | null;
};

export async function getHomeRecommendedDestinations(sectionType: "today_pick" | "more_explore"): Promise<DestinationItem[]> {
  if (!hasSupabaseEnv()) return [];

  try {
    const supabase = createPublicClient();
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("home_recommendations")
      .select("destination_id,section_type,sort_order,recommendation,custom_title,custom_cover_image")
      .eq("section_type", sectionType)
      .eq("is_active", true)
      .or(`start_at.is.null,start_at.lte.${now}`)
      .or(`end_at.is.null,end_at.gte.${now}`)
      .order("sort_order", { ascending: true })
      .limit(sectionType === "today_pick" ? 1 : 24);

    if (error || !data || data.length === 0) return [];

    const ids = (data as HomeRecommendationRow[])
      .map((row) => row.destination_id)
      .filter((id): id is string => typeof id === "string" && id.length > 0);

    if (ids.length === 0) return [];

    const { data: destinations, error: destinationError } = await supabase
      .from("destinations")
      .select(publicDestinationSelectFields)
      .eq("is_active", true)
      .in("id", ids);

    if (destinationError || !destinations) return [];

    const byId = new Map(
      (destinations as DestinationRow[])
        .map(normalizeRow)
        .filter((item): item is DestinationItem => item !== null)
        .map((item) => [item.id, item])
    );

    const recommendationById = new Map(
      (data as HomeRecommendationRow[])
        .filter((row) => typeof row.destination_id === "string")
        .map((row) => [row.destination_id as string, row])
    );

    return ids
      .map((id) => {
        const item = byId.get(id);
        const recommendation = recommendationById.get(id);
        if (!item) return undefined;
        const enriched: DestinationItem = {
          ...item,
          coverImage: recommendation?.custom_cover_image?.trim() || item.coverImage,
          editorRecommendation: recommendation?.recommendation?.trim() || item.editorRecommendation,
          homeRecommendation: {
            recommendation: recommendation?.recommendation ?? null,
            customTitle: recommendation?.custom_title ?? null,
            customCoverImage: recommendation?.custom_cover_image ?? null
          }
        };
        return enriched;
      })
      .filter((item): item is DestinationItem => item !== undefined);
  } catch {
    return [];
  }
}

export async function getFilteredDestinations(filters: DestinationFilters): Promise<DestinationItem[]> {
  return filterDestinations(await getAllDestinations(), filters);
}

export async function getDestinationById(id: string): Promise<DestinationItem | null> {
  const all = await getAllDestinations();
  return all.find((item) => item.id === id) ?? null;
}

export async function getDestinationPhotos(destinationId: string): Promise<DestinationPhoto[]> {
  if (!hasSupabaseEnv()) return [];

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("destination_photos")
      .select("id,destination_id,image_url,category,alt_text,is_cover,sort_order,created_at,updated_at")
      .eq("destination_id", destinationId)
      .order("is_cover", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error || !data) return [];
    return (data as DestinationPhotoRow[]).map(normalizePhoto);
  } catch {
    return [];
  }
}

export async function getRelatedDestinations(id: string, limit = 3): Promise<DestinationItem[]> {
  const all = await getAllDestinations();
  const current = all.find((item) => item.id === id);
  if (!current) return [];

  return all
    .filter((item) => item.id !== id && (item.scenario === current.scenario || item.city === current.city))
    .slice(0, limit);
}

export async function getMyFavoriteDestinations(): Promise<DestinationItem[]> {
  if (!hasSupabaseEnv()) return [];

  try {
    const { supabase, user } = await getCurrentAuth();

    if (!user) return [];

    const { data: favoriteRows, error: favoriteError } = await supabase
      .from("favorites")
      .select("destination_id")
      .eq("user_id", user.id);

    if (favoriteError || !favoriteRows || favoriteRows.length === 0) return [];

    const ids = favoriteRows.map((row) => row.destination_id);

    const { data: destinationRows, error: destinationError } = await supabase
      .from("destinations")
      .select(destinationSelectFields)
      .eq("is_active", true)
      .in("id", ids);

    if (destinationError || !destinationRows) return [];

    return (destinationRows as DestinationRow[])
      .map(normalizeRow)
      .filter((item): item is DestinationItem => item !== null);
  } catch {
    return [];
  }
}

export async function getMyFavoriteDestinationIds(): Promise<string[]> {
  if (!hasSupabaseEnv()) return [];

  try {
    const { supabase, user } = await getCurrentAuth();

    if (!user) return [];

    const { data, error } = await supabase.from("favorites").select("destination_id").eq("user_id", user.id);
    if (error || !data) return [];

    return data.map((row) => row.destination_id).filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}
