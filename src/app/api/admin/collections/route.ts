import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import type { CollectedSpot, CollectedSpotStatus } from "@/features/collections/types";
import { getRequestAuth } from "@/lib/auth/request-auth";

type CollectionRow = {
  id: string;
  source_url: string;
  video_url: string | null;
  creator_name: string | null;
  name: string;
  city: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  recommendation: string;
  suitable_age: string | null;
  min_kid_age: number;
  is_family_friendly: boolean;
  can_creek: boolean;
  is_camping: boolean;
  is_free: boolean;
  ticket_price: string | null;
  parking_info: string | null;
  safety_tips: string | null;
  tags: string[] | null;
  status: CollectedSpotStatus;
  review_note: string | null;
  created_at: string;
};

type CreatePayload = {
  sourceUrl?: string;
  videoUrl?: string;
  creatorName?: string;
  name?: string;
  city?: string;
  address?: string;
  latitude?: string | number | null;
  longitude?: string | number | null;
  recommendation?: string;
  suitableAge?: string;
  minKidAge?: string | number | null;
  isFamilyFriendly?: boolean;
  canCreek?: boolean;
  isCamping?: boolean;
  isFree?: boolean;
  ticketPrice?: string;
  parkingInfo?: string;
  safetyTips?: string;
  tags?: string[];
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

function toNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function trimOrNull(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}

function normalizeTags(values: unknown) {
  if (!Array.isArray(values)) return [];
  return values.map(String).map((value) => value.trim()).filter(Boolean).slice(0, 12);
}

function normalize(row: CollectionRow): CollectedSpot {
  return {
    id: row.id,
    sourceUrl: row.source_url,
    videoUrl: row.video_url,
    creatorName: row.creator_name,
    name: row.name,
    city: row.city,
    address: row.address,
    latitude: row.latitude === null ? null : Number(row.latitude),
    longitude: row.longitude === null ? null : Number(row.longitude),
    recommendation: row.recommendation,
    suitableAge: row.suitable_age,
    minKidAge: row.min_kid_age,
    isFamilyFriendly: row.is_family_friendly,
    canCreek: row.can_creek,
    isCamping: row.is_camping,
    isFree: row.is_free,
    ticketPrice: row.ticket_price,
    parkingInfo: row.parking_info,
    safetyTips: row.safety_tips,
    tags: row.tags ?? [],
    status: row.status,
    reviewNote: row.review_note,
    createdAt: row.created_at
  };
}

async function requireAdmin(request: Request) {
  const auth = await getRequestAuth(request);
  if (!auth.user) return { ...auth, isAdmin: false };
  const { data } = await auth.supabase.from("admin_users").select("user_id").eq("user_id", auth.user.id).maybeSingle();
  return { ...auth, isAdmin: Boolean(data) };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const { supabase, user, isAdmin, authSource } = await requireAdmin(request);
  if (!user) return NextResponse.json({ ok: false, items: [], message: "\u8bf7\u5148\u767b\u5f55\u3002", authSource }, { status: 401 });
  if (!isAdmin) return NextResponse.json({ ok: false, items: [], message: "\u4f60\u6ca1\u6709\u7ba1\u7406\u5458\u6743\u9650\u3002", authSource }, { status: 403 });

  const city = searchParams.get("city")?.trim();
  const tag = searchParams.get("tag")?.trim();
  const status = searchParams.get("status")?.trim();
  const family = searchParams.get("family") === "true";
  const creek = searchParams.get("creek") === "true";
  const camping = searchParams.get("camping") === "true";

  let query = supabase.from("collected_spots").select("*").order("created_at", { ascending: false }).limit(200);
  if (city) query = query.ilike("city", `%${city}%`);
  if (tag) query = query.contains("tags", [tag]);
  if (status && ["pending", "approved", "rejected"].includes(status)) query = query.eq("status", status);
  if (family) query = query.eq("is_family_friendly", true);
  if (creek) query = query.eq("can_creek", true);
  if (camping) query = query.eq("is_camping", true);

  const { data, error } = await query;
  if (error || !data) return NextResponse.json({ ok: false, items: [], message: "\u8bfb\u53d6\u91c7\u96c6\u5730\u70b9\u5931\u8d25\u3002" }, { status: 500 });
  return NextResponse.json({ ok: true, items: (data as CollectionRow[]).map(normalize), authSource });
}

export async function POST(request: Request) {
  const { supabase, user, isAdmin } = await requireAdmin(request);
  if (!user) return NextResponse.json({ ok: false, message: "\u8bf7\u5148\u767b\u5f55\u3002" }, { status: 401 });
  if (!isAdmin) return NextResponse.json({ ok: false, message: "\u4f60\u6ca1\u6709\u7ba1\u7406\u5458\u6743\u9650\u3002" }, { status: 403 });

  const body = (await request.json()) as CreatePayload;
  const sourceUrl = String(body.sourceUrl ?? "").trim();
  const name = String(body.name ?? "").trim();
  const city = String(body.city ?? "").trim();
  const recommendation = String(body.recommendation ?? "").trim();
  if (!sourceUrl || !name || !city || !recommendation) {
    return NextResponse.json({ ok: false, message: "\u8bf7\u586b\u5199\u6765\u6e90\u94fe\u63a5\u3001\u5730\u70b9\u540d\u79f0\u3001\u57ce\u5e02\u548c\u63a8\u8350\u7406\u7531\u3002" }, { status: 400 });
  }

  const { error } = await supabase.from("collected_spots").insert({
    created_by: user.id,
    source_url: sourceUrl,
    video_url: trimOrNull(body.videoUrl),
    creator_name: trimOrNull(body.creatorName),
    name,
    city,
    address: trimOrNull(body.address),
    latitude: toNumber(body.latitude),
    longitude: toNumber(body.longitude),
    recommendation,
    suitable_age: trimOrNull(body.suitableAge),
    min_kid_age: Number(body.minKidAge || 0) || 0,
    is_family_friendly: body.isFamilyFriendly !== false,
    can_creek: Boolean(body.canCreek),
    is_camping: Boolean(body.isCamping),
    is_free: Boolean(body.isFree),
    ticket_price: trimOrNull(body.ticketPrice),
    parking_info: trimOrNull(body.parkingInfo),
    safety_tips: trimOrNull(body.safetyTips),
    tags: normalizeTags(body.tags),
    status: "pending",
    updated_at: new Date().toISOString()
  });

  if (error) return NextResponse.json({ ok: false, message: `\u4fdd\u5b58\u5931\u8d25\uff1a${error.message}` }, { status: 500 });
  return NextResponse.json({ ok: true, message: "\u5df2\u751f\u6210\u5f85\u5ba1\u6838\u5730\u70b9\u3002" });
}

export async function PATCH(request: Request) {
  const { supabase, user, isAdmin } = await requireAdmin(request);
  if (!user) return NextResponse.json({ ok: false, message: "\u8bf7\u5148\u767b\u5f55\u3002" }, { status: 401 });
  if (!isAdmin) return NextResponse.json({ ok: false, message: "\u4f60\u6ca1\u6709\u7ba1\u7406\u5458\u6743\u9650\u3002" }, { status: 403 });

  const body = (await request.json()) as { id?: string; action?: "approve" | "reject"; reviewNote?: string };
  if (!body.id || !body.action) return NextResponse.json({ ok: false, message: "\u8bf7\u6c42\u683c\u5f0f\u4e0d\u6b63\u786e\u3002" }, { status: 400 });

  const { data: item, error: readError } = await supabase.from("collected_spots").select("*").eq("id", body.id).maybeSingle();
  if (readError || !item) return NextResponse.json({ ok: false, message: "\u6ca1\u6709\u627e\u5230\u8fd9\u6761\u91c7\u96c6\u8bb0\u5f55\u3002" }, { status: 404 });
  const row = item as CollectionRow;

  if (body.action === "reject") {
    const { error } = await supabase
      .from("collected_spots")
      .update({ status: "rejected", review_note: body.reviewNote || "\u6682\u4e0d\u53d1\u5e03", reviewed_by: user.id, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", body.id);
    if (error) return NextResponse.json({ ok: false, message: "\u62d2\u7edd\u5931\u8d25\u3002" }, { status: 500 });
    return NextResponse.json({ ok: true, message: "\u5df2\u6807\u8bb0\u4e3a\u4e0d\u53d1\u5e03\u3002" });
  }

  const scenario = row.can_creek ? "creek" : row.is_camping ? "camping" : "picnic";
  const descriptionParts = [
    row.recommendation,
    row.suitable_age ? `\u9002\u5408\u5e74\u9f84\uff1a${row.suitable_age}` : null,
    row.ticket_price ? `\u95e8\u7968\u4fe1\u606f\uff1a${row.ticket_price}` : null,
    row.parking_info ? `\u505c\u8f66\u4fe1\u606f\uff1a${row.parking_info}` : null,
    row.safety_tips ? `\u5b89\u5168\u63d0\u9192\uff1a${row.safety_tips}` : null,
    row.is_free ? "\u514d\u8d39\u4fe1\u606f\uff1a\u514d\u8d39\u6216\u4ee5\u73b0\u573a\u4e3a\u51c6" : null
  ].filter(Boolean);

  const { error: destinationError } = await supabase.from("destinations").upsert(
    {
      external_id: `collection-${row.id}`,
      name: row.name,
      name_zh: row.name,
      province: null,
      province_zh: null,
      city: row.city,
      city_zh: row.city,
      latitude: row.latitude ?? 0,
      longitude: row.longitude ?? 0,
      scenario,
      distance_km: 0,
      difficulty: "easy",
      safety: row.safety_tips ? "medium_risk" : "low_risk",
      rating: 4.6,
      has_parking: Boolean(row.parking_info),
      has_toilet: false,
      min_kid_age: row.min_kid_age,
      ticket_price: row.ticket_price,
      image: "",
      description: descriptionParts.join("\n"),
      description_zh: descriptionParts.join("\n"),
      updated_at: new Date().toISOString()
    },
    { onConflict: "external_id" }
  );

  if (destinationError) return NextResponse.json({ ok: false, message: `\u53d1\u5e03\u5931\u8d25\uff1a${destinationError.message}` }, { status: 500 });

  await supabase
    .from("collected_spots")
    .update({ status: "approved", review_note: "\u5df2\u53d1\u5e03\u5230\u524d\u53f0\u76ee\u7684\u5730\u5217\u8868", reviewed_by: user.id, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", body.id);

  revalidateTag("destinations");
  revalidatePath("/destinations");
  revalidatePath("/map");
  revalidatePath("/admin/collections");
  return NextResponse.json({ ok: true, message: "\u5df2\u5ba1\u6838\u901a\u8fc7\u5e76\u53d1\u5e03\u5230\u524d\u53f0\u3002" });
}
