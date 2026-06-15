import { NextResponse } from "next/server";
import type { DestinationItem } from "@/features/destinations/types";
import { getRequestAuth } from "@/lib/auth/request-auth";

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
};

type FavoriteRow = {
  destination_id: string;
};

const destinationSelectFields =
  "id,name,name_zh,province,province_zh,city,city_zh,latitude,longitude,scenario,distance_km,difficulty,safety,rating,has_parking,has_toilet,min_kid_age,image,description,description_zh";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
    descriptionZh: row.description_zh
  };
}

export async function GET(request: Request) {
  const { supabase, user, authSource } = await getRequestAuth(request);
  if (!user) {
    return NextResponse.json({ ok: false, destinations: [], authSource, message: "\u8bf7\u5148\u767b\u5f55\u540e\u518d\u67e5\u770b\u6536\u85cf\u3002" }, { status: 401 });
  }

  const { data: favoriteRows, error: favoriteError } = await supabase.from("favorites").select("destination_id").eq("user_id", user.id);
  if (favoriteError || !favoriteRows || favoriteRows.length === 0) {
    return NextResponse.json({ ok: true, destinations: [], authSource });
  }

  const ids = (favoriteRows as FavoriteRow[]).map((row) => row.destination_id).filter(Boolean);
  const { data: destinationRows, error: destinationError } = await supabase.from("destinations").select(destinationSelectFields).in("id", ids);
  if (destinationError || !destinationRows) {
    return NextResponse.json({ ok: false, destinations: [], message: "\u8bfb\u53d6\u6536\u85cf\u5931\u8d25\u3002" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    destinations: (destinationRows as DestinationRow[]).map(normalizeRow).filter((item): item is DestinationItem => item !== null),
    authSource
  });
}
