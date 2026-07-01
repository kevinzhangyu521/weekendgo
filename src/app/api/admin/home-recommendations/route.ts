import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getRequestAuth } from "@/lib/auth/request-auth";

type RecommendationRow = {
  id: string;
  destination_id: string;
  section_type: "today_pick" | "more_explore";
  sort_order: number | null;
  is_active: boolean | null;
  start_at: string | null;
  end_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type DestinationRow = {
  id: string;
  name: string;
  name_zh: string | null;
  city: string | null;
  city_zh: string | null;
};

async function requireAdmin(request: Request) {
  const auth = await getRequestAuth(request);
  if (!auth.user) return { ...auth, isAdmin: false };

  const { data } = await auth.supabase.from("admin_users").select("user_id").eq("user_id", auth.user.id).maybeSingle();
  return { ...auth, isAdmin: Boolean(data) };
}

function normalizeRecommendation(row: RecommendationRow, destination?: DestinationRow | null) {
  return {
    id: row.id,
    destinationId: row.destination_id,
    destinationName: destination?.name_zh || destination?.name || row.destination_id,
    destinationCity: destination?.city_zh || destination?.city || "",
    sectionType: row.section_type,
    sortOrder: row.sort_order ?? 100,
    isActive: row.is_active ?? true,
    startAt: row.start_at,
    endAt: row.end_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function cleanSectionType(value: unknown): "today_pick" | "more_explore" {
  return value === "more_explore" ? "more_explore" : "today_pick";
}

const selectFields = "id,destination_id,section_type,sort_order,is_active,start_at,end_at,created_at,updated_at";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { supabase, user, isAdmin, authSource } = await requireAdmin(request);
  if (!user) return NextResponse.json({ ok: false, items: [], isAdmin: false, authSource, message: "\u8bf7\u5148\u767b\u5f55\u3002" }, { status: 401 });
  if (!isAdmin) return NextResponse.json({ ok: false, items: [], isAdmin: false, authSource, message: "\u4f60\u6ca1\u6709\u7ba1\u7406\u5458\u6743\u9650\u3002" }, { status: 403 });

  const { data, error } = await supabase
    .from("home_recommendations")
    .select(selectFields)
    .order("section_type", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error || !data) {
    return NextResponse.json({ ok: false, items: [], isAdmin: true, message: "\u8bfb\u53d6\u9996\u9875\u63a8\u8350\u5931\u8d25\uff0c\u8bf7\u786e\u8ba4\u6570\u636e\u5e93\u5df2\u521b\u5efa home_recommendations \u8868\u3002" }, { status: 500 });
  }

  const rows = data as RecommendationRow[];
  const ids = rows.map((row) => row.destination_id);
  let destinations: DestinationRow[] = [];
  if (ids.length > 0) {
    const destinationResult = await supabase.from("destinations").select("id,name,name_zh,city,city_zh").in("id", ids);
    destinations = (destinationResult.data ?? []) as DestinationRow[];
  }
  const destinationMap = new Map(destinations.map((item) => [item.id, item]));

  return NextResponse.json({
    ok: true,
    isAdmin: true,
    items: rows.map((row) => normalizeRecommendation(row, destinationMap.get(row.destination_id))),
    authSource
  });
}

export async function POST(request: Request) {
  const { supabase, user, isAdmin } = await requireAdmin(request);
  if (!user) return NextResponse.json({ ok: false, message: "\u8bf7\u5148\u767b\u5f55\u3002" }, { status: 401 });
  if (!isAdmin) return NextResponse.json({ ok: false, message: "\u4f60\u6ca1\u6709\u7ba1\u7406\u5458\u6743\u9650\u3002" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const destinationId = String(body.destinationId ?? "").trim();
  if (!destinationId) return NextResponse.json({ ok: false, message: "\u8bf7\u9009\u62e9\u76ee\u7684\u5730\u3002" }, { status: 400 });

  const payload = {
    destination_id: destinationId,
    section_type: cleanSectionType(body.sectionType),
    sort_order: Number(body.sortOrder ?? 100) || 100,
    is_active: body.isActive !== false,
    start_at: body.startAt ? String(body.startAt) : null,
    end_at: body.endAt ? String(body.endAt) : null,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase.from("home_recommendations").upsert(payload, { onConflict: "destination_id,section_type" }).select(selectFields).single();
  if (error || !data) return NextResponse.json({ ok: false, message: "\u4fdd\u5b58\u9996\u9875\u63a8\u8350\u5931\u8d25\u3002" }, { status: 500 });

  revalidatePath("/");
  return NextResponse.json({ ok: true, item: normalizeRecommendation(data as RecommendationRow) });
}

export async function PATCH(request: Request) {
  const { supabase, user, isAdmin } = await requireAdmin(request);
  if (!user) return NextResponse.json({ ok: false, message: "\u8bf7\u5148\u767b\u5f55\u3002" }, { status: 401 });
  if (!isAdmin) return NextResponse.json({ ok: false, message: "\u4f60\u6ca1\u6709\u7ba1\u7406\u5458\u6743\u9650\u3002" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const id = String(body.id ?? "").trim();
  if (!id) return NextResponse.json({ ok: false, message: "\u7f3a\u5c11\u63a8\u8350\u8bb0\u5f55 ID\u3002" }, { status: 400 });

  const payload = {
    section_type: cleanSectionType(body.sectionType),
    sort_order: Number(body.sortOrder ?? 100) || 100,
    is_active: body.isActive !== false,
    start_at: body.startAt ? String(body.startAt) : null,
    end_at: body.endAt ? String(body.endAt) : null,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase.from("home_recommendations").update(payload).eq("id", id).select(selectFields).single();
  if (error || !data) return NextResponse.json({ ok: false, message: "\u66f4\u65b0\u9996\u9875\u63a8\u8350\u5931\u8d25\u3002" }, { status: 500 });

  revalidatePath("/");
  return NextResponse.json({ ok: true, item: normalizeRecommendation(data as RecommendationRow) });
}

export async function DELETE(request: Request) {
  const { supabase, user, isAdmin } = await requireAdmin(request);
  if (!user) return NextResponse.json({ ok: false, message: "\u8bf7\u5148\u767b\u5f55\u3002" }, { status: 401 });
  if (!isAdmin) return NextResponse.json({ ok: false, message: "\u4f60\u6ca1\u6709\u7ba1\u7406\u5458\u6743\u9650\u3002" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id")?.trim();
  if (!id) return NextResponse.json({ ok: false, message: "\u7f3a\u5c11\u63a8\u8350\u8bb0\u5f55 ID\u3002" }, { status: 400 });

  const { error } = await supabase.from("home_recommendations").delete().eq("id", id);
  if (error) return NextResponse.json({ ok: false, message: "\u5220\u9664\u9996\u9875\u63a8\u8350\u5931\u8d25\u3002" }, { status: 500 });

  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
