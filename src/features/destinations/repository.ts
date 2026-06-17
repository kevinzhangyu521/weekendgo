import { destinationMockData } from "./mock-data";
import { filterDestinations } from "./filter";
import type { DestinationFilters, DestinationItem } from "./types";
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
  image: string | null;
  description: string | null;
  description_zh: string | null;
  is_active: boolean | null;
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
    image: row.image ?? "",
    description: row.description ?? "",
    descriptionZh: row.description_zh,
    isActive: row.is_active ?? true
  };
}

const destinationSelectFields =
  "id,name,name_zh,province,province_zh,city,city_zh,latitude,longitude,scenario,distance_km,difficulty,safety,rating,has_parking,has_toilet,min_kid_age,image,description,description_zh,is_active";

async function fetchPublicSupabaseDestinations(): Promise<DestinationItem[] | null> {
  if (!hasSupabaseEnv()) return null;

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("destinations")
      .select(destinationSelectFields)
      .eq("is_active", true)
      .order("rating", { ascending: false })
      .limit(120);

    if (error || !data) return null;

    return (data as DestinationRow[]).map(normalizeRow).filter((item): item is DestinationItem => item !== null);
  } catch {
    return null;
  }
}

const getCachedPublicDestinations = unstable_cache(
  async () => fetchPublicSupabaseDestinations(),
  ["public-destinations-v1"],
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

export async function getFilteredDestinations(filters: DestinationFilters): Promise<DestinationItem[]> {
  return filterDestinations(await getAllDestinations(), filters);
}

export async function getDestinationById(id: string): Promise<DestinationItem | null> {
  const all = await getAllDestinations();
  return all.find((item) => item.id === id) ?? null;
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
