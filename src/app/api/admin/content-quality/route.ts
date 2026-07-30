import { NextResponse } from "next/server";
import { calculateContentHealth, type ExperienceCounts, type FamilyDestinationExperienceStatus } from "@/features/admin/content-health";
import type { AdminDestination } from "@/features/admin/destinations";
import type { DestinationItem, DestinationPhoto } from "@/features/destinations/types";
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

type FamilyExperienceStatusRow = {
  destination_id: string;
  status: FamilyDestinationExperienceStatus;
};

const destinationSelectFields =
  "id,external_id,name,name_zh,province,province_zh,city,city_zh,address,opening_hours,latitude,longitude,scenario,distance_km,difficulty,safety,rating,has_parking,has_toilet,min_kid_age,suitable_age_min,suitable_age_max,suggested_duration,family_budget,reservation_required,parking_detail,toilet_detail,stroller_friendly,pet_friendly,best_time,ticket_price,image,description,description_zh,editor_recommendation,family_tips,avoid_pitfalls,is_active,updated_at";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function normalizeDestination(row: DestinationRow): AdminDestination | null {
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

function emptyExperienceCounts(): ExperienceCounts {
  return { approved: 0, pending: 0, rejected: 0 };
}

export async function GET(request: Request) {
  const auth = await getRequestAuth(request);
  if (!auth.user) {
    return NextResponse.json({ ok: false, isAdmin: false, items: [], message: "\u8bf7\u5148\u767b\u5f55\u7ba1\u7406\u5458\u8d26\u53f7\u3002" }, { status: 401 });
  }
  if (!auth.isAdmin) {
    return NextResponse.json({ ok: false, isAdmin: false, items: [], message: "\u4f60\u6ca1\u6709\u7ba1\u7406\u5458\u6743\u9650\u3002" }, { status: 403 });
  }

  const { data, error } = await auth.supabase
    .from("destinations")
    .select(destinationSelectFields)
    .order("updated_at", { ascending: false })
    .limit(300);

  if (error || !data) {
    return NextResponse.json({ ok: false, isAdmin: true, items: [], message: "\u8bfb\u53d6\u5185\u5bb9\u8d28\u91cf\u6570\u636e\u5931\u8d25\u3002" }, { status: 500 });
  }

  const destinations = (data as DestinationRow[])
    .map(normalizeDestination)
    .filter((item): item is AdminDestination => item !== null);
  const ids = destinations.map((item) => item.id);

  const [photoResult, experienceResult] = ids.length > 0
    ? await Promise.all([
        auth.supabase
          .from("destination_photos")
          .select("id,destination_id,image_url,category,alt_text,is_cover,sort_order,created_at,updated_at")
          .in("destination_id", ids),
        auth.supabase
          .from("family_destination_experiences")
          .select("destination_id,status")
          .in("destination_id", ids)
      ])
    : [{ data: [] }, { data: [] }];

  const photosByDestination: Record<string, DestinationPhoto[]> = {};
  ((photoResult.data ?? []) as DestinationPhotoRow[]).forEach((row) => {
    const photo = normalizePhoto(row);
    photosByDestination[photo.destinationId] = [...(photosByDestination[photo.destinationId] ?? []), photo];
  });

  const experiencesByDestination: Record<string, ExperienceCounts> = {};
  ((experienceResult.data ?? []) as FamilyExperienceStatusRow[]).forEach((experience) => {
    const current = experiencesByDestination[experience.destination_id] ?? emptyExperienceCounts();
    experiencesByDestination[experience.destination_id] = {
      ...current,
      [experience.status]: current[experience.status] + 1
    };
  });

  const items = destinations.map((destination) => {
    const health = calculateContentHealth(destination, photosByDestination[destination.id] ?? [], experiencesByDestination[destination.id]);
    return {
      id: destination.id,
      name: destination.name,
      nameZh: destination.nameZh,
      city: destination.city,
      cityZh: destination.cityZh,
      isActive: destination.isActive,
      updatedAt: destination.updatedAt,
      health
    };
  });

  return NextResponse.json({ ok: true, isAdmin: true, items });
}
