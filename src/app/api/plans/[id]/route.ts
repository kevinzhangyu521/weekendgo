import { NextResponse } from "next/server";
import type { DestinationItem } from "@/features/destinations/types";
import type { PlanDetail } from "@/features/plans/types";
import { getRequestAuth } from "@/lib/auth/request-auth";

type PlanRow = {
  id: string;
  title: string;
  plan_date: string;
  status: PlanDetail["status"];
  is_public: boolean;
  share_slug: string | null;
  notes: string | null;
};

type PlanItemDestinationRow = {
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

type PlanItemQueryRow = {
  id: string;
  sort_order: number;
  destination: PlanItemDestinationRow | PlanItemDestinationRow[] | null;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

function normalizeDestination(row: PlanItemDestinationRow | null): DestinationItem | null {
  if (!row || !row.id || !row.name || !row.scenario || !row.difficulty || !row.safety) return null;
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

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, authSource } = await getRequestAuth(request);

  if (!user) {
    return NextResponse.json({ ok: false, plan: null, authSource, message: "\u8bf7\u5148\u767b\u5f55\u540e\u518d\u67e5\u770b\u8ba1\u5212\u3002" }, { status: 401 });
  }

  const { data: plan, error: planError } = await supabase
    .from("weekend_plans")
    .select("id,title,plan_date,status,is_public,share_slug,notes")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (planError || !plan) {
    return NextResponse.json({ ok: false, plan: null, authSource, message: "\u6ca1\u6709\u627e\u5230\u8fd9\u4e2a\u8ba1\u5212\u3002" }, { status: 404 });
  }

  const { data: items } = await supabase
    .from("plan_items")
    .select(
      "id,sort_order,destination:destinations(id,name,name_zh,province,province_zh,city,city_zh,latitude,longitude,scenario,distance_km,difficulty,safety,rating,has_parking,has_toilet,min_kid_age,image,description,description_zh)"
    )
    .eq("plan_id", id)
    .order("sort_order", { ascending: true });

  const row = plan as PlanRow;
  const detail: PlanDetail = {
    id: row.id,
    title: row.title,
    planDate: row.plan_date,
    status: row.status,
    isPublic: row.is_public,
    shareSlug: row.share_slug,
    notes: row.notes ?? "",
    items: ((items ?? []) as unknown as PlanItemQueryRow[]).map((item) => {
      const destination = Array.isArray(item.destination) ? item.destination[0] ?? null : item.destination;
      return {
        id: item.id,
        sortOrder: item.sort_order,
        destination: normalizeDestination(destination)
      };
    })
  };

  return NextResponse.json({ ok: true, plan: detail, authSource });
}
