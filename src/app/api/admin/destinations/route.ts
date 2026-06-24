import { NextResponse } from "next/server";
import type { AdminDestination } from "@/features/admin/destinations";
import type { DestinationItem } from "@/features/destinations/types";
import { getRequestAuth } from "@/lib/auth/request-auth";

type DestinationRow = {
  id: string;
  external_id: string | null;
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
  ticket_price: string | null;
  image: string | null;
  description: string | null;
  description_zh: string | null;
  is_active: boolean | null;
  updated_at: string | null;
};

const selectFields =
  "id,external_id,name,name_zh,province,province_zh,city,city_zh,latitude,longitude,scenario,distance_km,difficulty,safety,rating,has_parking,has_toilet,min_kid_age,ticket_price,image,description,description_zh,is_active,updated_at";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
    ticketPrice: row.ticket_price,
    image: row.image ?? "",
    description: row.description ?? "",
    descriptionZh: row.description_zh,
    isActive: row.is_active ?? true,
    updatedAt: row.updated_at
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const { supabase, user, authSource } = await getRequestAuth(request);

  if (!user) {
    return NextResponse.json({ ok: false, destinations: [], isAdmin: false, authSource, message: "\u8bf7\u5148\u767b\u5f55\u3002" }, { status: 401 });
  }

  const { data: admin } = await supabase.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!admin) {
    return NextResponse.json({ ok: false, destinations: [], isAdmin: false, authSource, message: "\u4f60\u6ca1\u6709\u7ba1\u7406\u5458\u6743\u9650\u3002" }, { status: 403 });
  }

  let query = supabase.from("destinations").select(selectFields).order("updated_at", { ascending: false }).limit(200);
  if (q) {
    query = query.or(`name.ilike.%${q}%,name_zh.ilike.%${q}%,province.ilike.%${q}%,province_zh.ilike.%${q}%,city.ilike.%${q}%,city_zh.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error || !data) {
    return NextResponse.json({ ok: false, destinations: [], isAdmin: true, message: "\u8bfb\u53d6\u76ee\u7684\u5730\u5931\u8d25\u3002" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    isAdmin: true,
    destinations: (data as DestinationRow[]).map(normalize).filter((item): item is AdminDestination => item !== null),
    authSource
  });
}
