import { createClient } from "@/lib/supabase/server";
import type { DestinationItem } from "@/features/destinations/types";
import type { PlanDetail, PlanSummary } from "./types";

type PlanRow = {
  id: string;
  title: string;
  plan_date: string;
  status: "draft" | "published" | "archived";
  is_public: boolean;
  share_slug: string | null;
  notes: string;
};

type PlanItemRow = {
  id: string;
  sort_order: number;
  destination: PlanItemDestinationRow | null;
};

type PlanItemQueryRow = {
  id: string;
  sort_order: number;
  destination: PlanItemDestinationRow | PlanItemDestinationRow[] | null;
};

type PlanItemDestinationRow = {
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

function normalizeDestination(row: PlanItemRow["destination"]): DestinationItem | null {
  if (!row || !row.id || !row.name || !row.scenario || !row.difficulty || !row.safety) return null;
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

function normalizePlanItemRows(rows: PlanItemQueryRow[] | null): PlanDetail["items"] {
  return (rows ?? []).map((row) => {
    const destination = Array.isArray(row.destination) ? (row.destination[0] ?? null) : row.destination;
    return {
      id: row.id,
      sortOrder: row.sort_order,
      destination: normalizeDestination(destination)
    };
  });
}

export async function getMyPlans(): Promise<PlanSummary[]> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: plans, error } = await supabase
    .from("weekend_plans")
    .select("id,title,plan_date,status,is_public,share_slug,notes")
    .eq("user_id", user.id)
    .order("plan_date", { ascending: false });

  if (error || !plans) return [];

  const { data: items } = await supabase.from("plan_items").select("plan_id").in(
    "plan_id",
    (plans as PlanRow[]).map((p) => p.id)
  );

  const countMap = new Map<string, number>();
  (items ?? []).forEach((row: { plan_id: string }) => {
    countMap.set(row.plan_id, (countMap.get(row.plan_id) ?? 0) + 1);
  });

  return (plans as PlanRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    planDate: row.plan_date,
    status: row.status,
    isPublic: row.is_public,
    shareSlug: row.share_slug,
    itemCount: countMap.get(row.id) ?? 0
  }));
}

export async function getMyPlanById(planId: string): Promise<PlanDetail | null> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: plan, error: planError } = await supabase
    .from("weekend_plans")
    .select("id,title,plan_date,status,is_public,share_slug,notes")
    .eq("id", planId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (planError || !plan) return null;

  const { data: items } = await supabase
    .from("plan_items")
    .select(
      "id,sort_order,destination:destinations(id,name,name_zh,city,city_zh,latitude,longitude,scenario,distance_km,difficulty,safety,rating,has_parking,has_toilet,min_kid_age,image,description,description_zh)"
    )
    .eq("plan_id", planId)
    .order("sort_order", { ascending: true });

  return {
    id: (plan as PlanRow).id,
    title: (plan as PlanRow).title,
    planDate: (plan as PlanRow).plan_date,
    status: (plan as PlanRow).status,
    isPublic: (plan as PlanRow).is_public,
    shareSlug: (plan as PlanRow).share_slug,
    notes: (plan as PlanRow).notes ?? "",
    items: normalizePlanItemRows((items ?? []) as unknown as PlanItemQueryRow[])
  };
}

export async function getPublicPlanBySlug(shareSlug: string): Promise<PlanDetail | null> {
  const supabase = await createClient();
  const { data: plan, error: planError } = await supabase
    .from("weekend_plans")
    .select("id,title,plan_date,status,is_public,share_slug,notes")
    .eq("share_slug", shareSlug)
    .eq("is_public", true)
    .maybeSingle();

  if (planError || !plan) return null;

  const { data: items } = await supabase
    .from("plan_items")
    .select(
      "id,sort_order,destination:destinations(id,name,name_zh,city,city_zh,latitude,longitude,scenario,distance_km,difficulty,safety,rating,has_parking,has_toilet,min_kid_age,image,description,description_zh)"
    )
    .eq("plan_id", (plan as PlanRow).id)
    .order("sort_order", { ascending: true });

  return {
    id: (plan as PlanRow).id,
    title: (plan as PlanRow).title,
    planDate: (plan as PlanRow).plan_date,
    status: (plan as PlanRow).status,
    isPublic: (plan as PlanRow).is_public,
    shareSlug: (plan as PlanRow).share_slug,
    notes: (plan as PlanRow).notes ?? "",
    items: normalizePlanItemRows((items ?? []) as unknown as PlanItemQueryRow[])
  };
}
