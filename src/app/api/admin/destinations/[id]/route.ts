import { revalidatePath, revalidateTag } from "next/cache";
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
  image: string | null;
  description: string | null;
  description_zh: string | null;
  updated_at: string | null;
};

const selectFields =
  "id,external_id,name,name_zh,province,province_zh,city,city_zh,latitude,longitude,scenario,distance_km,difficulty,safety,rating,has_parking,has_toilet,min_kid_age,image,description,description_zh,updated_at";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function safeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "");
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
    updatedAt: row.updated_at
  };
}

async function requireBrowserAdmin(request: Request) {
  const auth = await getRequestAuth(request);
  if (!auth.user) return { ...auth, isAdmin: false };
  const { data } = await auth.supabase.from("admin_users").select("user_id").eq("user_id", auth.user.id).maybeSingle();
  return { ...auth, isAdmin: Boolean(data) };
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, isAdmin, authSource } = await requireBrowserAdmin(request);
  if (!user) return NextResponse.json({ ok: false, item: null, authSource, message: "\u8bf7\u5148\u767b\u5f55\u3002" }, { status: 401 });
  if (!isAdmin) return NextResponse.json({ ok: false, item: null, authSource, message: "\u4f60\u6ca1\u6709\u7ba1\u7406\u5458\u6743\u9650\u3002" }, { status: 403 });

  const { data, error } = await supabase.from("destinations").select(selectFields).eq("id", id).maybeSingle();
  if (error || !data) return NextResponse.json({ ok: false, item: null, message: "\u6ca1\u6709\u627e\u5230\u8fd9\u4e2a\u76ee\u7684\u5730\u3002" }, { status: 404 });
  return NextResponse.json({ ok: true, item: normalize(data as DestinationRow), authSource });
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
      latitude: Number(formData.get("latitude") || "0") || 0,
      longitude: Number(formData.get("longitude") || "0") || 0,
      scenario: String(formData.get("scenario") ?? "creek"),
      difficulty: String(formData.get("difficulty") ?? "easy"),
      safety: String(formData.get("safety") ?? "low_risk"),
      rating: Number(formData.get("rating") || "0") || 0,
      has_parking: formData.get("has_parking") === "on",
      has_toilet: formData.get("has_toilet") === "on",
      min_kid_age: Number(formData.get("min_kid_age") || "0") || 0,
      ...(imageUrl ? { image: imageUrl } : {}),
      description,
      description_zh: description,
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
