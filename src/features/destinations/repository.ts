import { destinationMockData } from "./mock-data";
import { filterDestinations } from "./filter";
import type { DestinationFilters, DestinationItem } from "./types";
import { createClient } from "@/lib/supabase/server";

type DestinationRow = {
  id: string;
  name: string;
  name_zh: string | null;
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
    descriptionZh: row.description_zh
  };
}

async function fetchSupabaseDestinations(filters?: DestinationFilters): Promise<DestinationItem[] | null> {
  if (!hasSupabaseEnv()) return null;

  try {
    const supabase = await createClient();
    let query = supabase
      .from("destinations")
      .select(
        "id,name,name_zh,city,city_zh,latitude,longitude,scenario,distance_km,difficulty,safety,rating,has_parking,has_toilet,min_kid_age,image,description,description_zh"
      )
      .order("rating", { ascending: false });

    if (filters) {
      if (filters.scenario !== "all") query = query.eq("scenario", filters.scenario);
      if (filters.difficulty !== "all") query = query.eq("difficulty", filters.difficulty);
      query = query.lte("distance_km", filters.maxDistanceKm);
      if (filters.needParking) query = query.eq("has_parking", true);
      if (filters.needToilet) query = query.eq("has_toilet", true);
    }

    const { data, error } = await query.limit(120);

    if (error || !data) return null;

    return (data as DestinationRow[]).map(normalizeRow).filter((item): item is DestinationItem => item !== null);
  } catch {
    return null;
  }
}

export async function getAllDestinations(): Promise<DestinationItem[]> {
  const fromSupabase = await fetchSupabaseDestinations();
  if (fromSupabase && fromSupabase.length > 0) return fromSupabase;
  return destinationMockData;
}

export async function getFilteredDestinations(filters: DestinationFilters): Promise<DestinationItem[]> {
  const fromSupabase = await fetchSupabaseDestinations(filters);
  if (fromSupabase) return fromSupabase;
  return filterDestinations(destinationMockData, filters);
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
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) return [];

    const { data: favoriteRows, error: favoriteError } = await supabase
      .from("favorites")
      .select("destination_id")
      .eq("user_id", user.id);

    if (favoriteError || !favoriteRows || favoriteRows.length === 0) return [];

    const ids = favoriteRows.map((row) => row.destination_id);

    const { data: destinationRows, error: destinationError } = await supabase
      .from("destinations")
      .select(
        "id,name,name_zh,city,city_zh,latitude,longitude,scenario,distance_km,difficulty,safety,rating,has_parking,has_toilet,min_kid_age,image,description,description_zh"
      )
      .in("id", ids);

    if (destinationError || !destinationRows) return [];

    return (destinationRows as DestinationRow[])
      .map(normalizeRow)
      .filter((item): item is DestinationItem => item !== null);
  } catch {
    return [];
  }
}
