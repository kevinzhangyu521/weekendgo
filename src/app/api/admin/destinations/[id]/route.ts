import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
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

const selectFields =
  "id,external_id,name,name_zh,province,province_zh,city,city_zh,address,opening_hours,latitude,longitude,scenario,distance_km,difficulty,safety,rating,has_parking,has_toilet,min_kid_age,suitable_age_min,suitable_age_max,suggested_duration,family_budget,reservation_required,parking_detail,toilet_detail,stroller_friendly,pet_friendly,best_time,ticket_price,image,description,description_zh,editor_recommendation,family_tips,avoid_pitfalls,is_active,updated_at";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function safeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "");
}

function optionalText(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function optionalInteger(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  if (!value) return null;
  const number = Number(value);
  return Number.isFinite(number) ? Math.trunc(number) : null;
}

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

async function requireBrowserAdmin(request: Request) {
  const auth = await getRequestAuth(request);
  if (!auth.user) return { ...auth, isAdmin: false };
  return auth;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, isAdmin, authSource } = await requireBrowserAdmin(request);
  if (!user) return NextResponse.json({ ok: false, item: null, authSource, message: "\u8bf7\u5148\u767b\u5f55\u3002" }, { status: 401 });
  if (!isAdmin) return NextResponse.json({ ok: false, item: null, authSource, message: "\u4f60\u6ca1\u6709\u7ba1\u7406\u5458\u6743\u9650\u3002" }, { status: 403 });

  const { data, error } = await supabase.from("destinations").select(selectFields).eq("id", id).maybeSingle();
  if (error || !data) return NextResponse.json({ ok: false, item: null, message: "\u6ca1\u6709\u627e\u5230\u8fd9\u4e2a\u76ee\u7684\u5730\u3002" }, { status: 404 });
  const item = normalize(data as DestinationRow);
  if (!item) return NextResponse.json({ ok: false, item: null, message: "\u76ee\u7684\u5730\u6570\u636e\u4e0d\u5b8c\u6574\u3002" }, { status: 404 });

  const { data: photos } = await supabase
    .from("destination_photos")
    .select("id,destination_id,image_url,category,alt_text,is_cover,sort_order,created_at,updated_at")
    .eq("destination_id", id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  return NextResponse.json({
    ok: true,
    item: {
      ...item,
      photos: ((photos ?? []) as DestinationPhotoRow[]).map(normalizePhoto)
    },
    authSource
  });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, isAdmin } = await requireBrowserAdmin(request);
  if (!user) return NextResponse.json({ ok: false, message: "\u8bf7\u5148\u767b\u5f55\u3002" }, { status: 401 });
  if (!isAdmin) return NextResponse.json({ ok: false, message: "\u4f60\u6ca1\u6709\u7ba1\u7406\u5458\u6743\u9650\u3002" }, { status: 403 });

  const formData = await request.formData();
  const name = String(formData.get("name") ?? "").trim();
  const province = String(formData.get("province") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!name || !province || !city || !description) {
    return NextResponse.json({ ok: false, message: "\u8bf7\u586b\u5199\u540d\u79f0\u3001\u7701\u4efd\u3001\u57ce\u5e02\u548c\u63cf\u8ff0\u3002" }, { status: 400 });
  }

  let imageUrl: string | null = null;
  const imageEntry = formData.get("image_file");
  const imageFile = imageEntry instanceof File ? imageEntry : null;
  if (imageFile && imageFile.size > 0 && imageFile.type.startsWith("image/")) {
    const path = `admin/${Date.now()}-${safeFileName(imageFile.name) || "destination-photo.jpg"}`;
    const { error: uploadError } = await supabase.storage.from("spot-submission-photos").upload(path, imageFile, {
      cacheControl: "3600",
      upsert: false
    });
    if (uploadError) return NextResponse.json({ ok: false, message: "\u56fe\u7247\u4e0a\u4f20\u5931\u8d25\u3002" }, { status: 500 });
    const { data } = supabase.storage.from("spot-submission-photos").getPublicUrl(path);
    imageUrl = data.publicUrl;
  }

  const { error } = await supabase
    .from("destinations")
    .update({
      name,
      name_zh: name,
      province,
      province_zh: province,
      city,
      city_zh: city,
      address: optionalText(formData, "address"),
      opening_hours: optionalText(formData, "opening_hours"),
      latitude: Number(formData.get("latitude") || "0") || 0,
      longitude: Number(formData.get("longitude") || "0") || 0,
      scenario: String(formData.get("scenario") ?? "creek"),
      difficulty: String(formData.get("difficulty") ?? "easy"),
      safety: String(formData.get("safety") ?? "low_risk"),
      rating: Number(formData.get("rating") || "0") || 0,
      has_parking: formData.get("has_parking") === "on",
      has_toilet: formData.get("has_toilet") === "on",
      min_kid_age: Number(formData.get("min_kid_age") || "0") || 0,
      suitable_age_min: optionalInteger(formData, "suitable_age_min"),
      suitable_age_max: optionalInteger(formData, "suitable_age_max"),
      suggested_duration: optionalText(formData, "suggested_duration"),
      family_budget: optionalText(formData, "family_budget"),
      reservation_required: formData.get("reservation_required") === "on",
      parking_detail: optionalText(formData, "parking_detail"),
      toilet_detail: optionalText(formData, "toilet_detail"),
      stroller_friendly: formData.get("stroller_friendly") === "on",
      pet_friendly: formData.get("pet_friendly") === "on",
      best_time: optionalText(formData, "best_time"),
      ticket_price: String(formData.get("ticket_price") ?? "").trim() || null,
      ...(imageUrl ? { image: imageUrl } : {}),
      description,
      description_zh: description,
      editor_recommendation: optionalText(formData, "editor_recommendation"),
      family_tips: optionalText(formData, "family_tips"),
      avoid_pitfalls: optionalText(formData, "avoid_pitfalls"),
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) return NextResponse.json({ ok: false, message: `\u4fdd\u5b58\u5931\u8d25\uff1a${error.message}` }, { status: 500 });

  revalidateTag("destinations");
  revalidatePath("/admin/destinations");
  revalidatePath(`/admin/destinations/${id}/edit`);
  revalidatePath("/destinations");
  revalidatePath(`/destinations/${id}`);
  revalidatePath("/map");
  revalidatePath("/favorites");
  revalidatePath("/plans");

  return NextResponse.json({ ok: true, message: "\u4fdd\u5b58\u6210\u529f\uff0c\u6b63\u5728\u8fd4\u56de\u76ee\u7684\u5730\u7ba1\u7406\u9875..." });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, isAdmin } = await requireBrowserAdmin(request);
  if (!user) return NextResponse.json({ ok: false, message: "\u8bf7\u5148\u767b\u5f55\u3002" }, { status: 401 });
  if (!isAdmin) return NextResponse.json({ ok: false, message: "\u4f60\u6ca1\u6709\u7ba1\u7406\u5458\u6743\u9650\u3002" }, { status: 403 });

  const body = (await request.json().catch(() => null)) as { isActive?: unknown } | null;
  if (typeof body?.isActive !== "boolean") {
    return NextResponse.json({ ok: false, message: "\u8bf7\u63d0\u4f9b\u6b63\u786e\u7684\u4e0a\u4e0b\u67b6\u72b6\u6001\u3002" }, { status: 400 });
  }

  const { error } = await supabase
    .from("destinations")
    .update({ is_active: body.isActive, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ ok: false, message: `\u64cd\u4f5c\u5931\u8d25\uff1a${error.message}` }, { status: 500 });

  revalidateTag("destinations");
  revalidatePath("/admin/destinations");
  revalidatePath(`/admin/destinations/${id}/edit`);
  revalidatePath("/destinations");
  revalidatePath(`/destinations/${id}`);
  revalidatePath("/map");
  revalidatePath("/favorites");
  revalidatePath("/plans");

  return NextResponse.json({ ok: true, message: body.isActive ? "\u5df2\u6062\u590d\u5c55\u793a\u3002" : "\u5df2\u4e0b\u67b6\uff0c\u524d\u53f0\u4e0d\u518d\u5c55\u793a\u3002" });
}
