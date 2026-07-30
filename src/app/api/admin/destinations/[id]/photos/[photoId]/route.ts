import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { DestinationPhoto } from "@/features/destinations/types";
import { getRequestAuth } from "@/lib/auth/request-auth";

type PhotoCategory = DestinationPhoto["category"];

type DestinationPhotoRow = {
  id: string;
  destination_id: string;
  image_url: string;
  category: PhotoCategory | null;
  alt_text: string | null;
  is_cover: boolean | null;
  sort_order: number | null;
  created_at: string | null;
  updated_at: string | null;
};

type PatchBody = {
  category?: unknown;
  altText?: unknown;
  sortOrder?: unknown;
  isCover?: unknown;
};

const categories = new Set<PhotoCategory>(["cover", "gallery", "play", "parking", "toilet", "food", "camping", "water"]);

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

function revalidateDestination(destinationId: string) {
  revalidateTag("destinations");
  revalidatePath("/admin/destinations");
  revalidatePath(`/admin/destinations/${destinationId}/edit`);
  revalidatePath("/destinations");
  revalidatePath(`/destinations/${destinationId}`);
  revalidatePath("/map");
}

function parseSortOrder(value: unknown) {
  const number = typeof value === "number" || typeof value === "string" ? Number(value) : 0;
  return Number.isFinite(number) ? Math.trunc(number) : 0;
}

async function requirePhoto(
  supabase: SupabaseClient,
  destinationId: string,
  photoId: string
) {
  const { data, error } = await supabase
    .from("destination_photos")
    .select("id,destination_id,image_url,category,alt_text,is_cover,sort_order,created_at,updated_at")
    .eq("id", photoId)
    .eq("destination_id", destinationId)
    .maybeSingle();

  if (error || !data) return null;
  return data as DestinationPhotoRow;
}

async function clearOtherCovers(supabase: SupabaseClient, destinationId: string, photoId: string) {
  return supabase
    .from("destination_photos")
    .update({ is_cover: false, category: "gallery", updated_at: new Date().toISOString() })
    .eq("destination_id", destinationId)
    .neq("id", photoId)
    .eq("is_cover", true);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; photoId: string }> }) {
  const { id, photoId } = await params;
  const { supabase, user, isAdmin } = await getRequestAuth(request);
  if (!user) return NextResponse.json({ ok: false, message: "请先登录。" }, { status: 401 });
  if (!isAdmin) return NextResponse.json({ ok: false, message: "你没有管理员权限。" }, { status: 403 });

  const existing = await requirePhoto(supabase, id, photoId);
  if (!existing) return NextResponse.json({ ok: false, message: "没有找到这张图片。" }, { status: 404 });

  const body = (await request.json().catch(() => null)) as PatchBody | null;
  if (!body) return NextResponse.json({ ok: false, message: "请求内容不完整。" }, { status: 400 });

  const rawCategory = typeof body.category === "string" && categories.has(body.category as PhotoCategory)
    ? (body.category as PhotoCategory)
    : existing.category ?? "gallery";
  const shouldBeCover = body.isCover === true || rawCategory === "cover";
  const category = shouldBeCover ? "cover" : rawCategory;

  const { data, error } = await supabase
    .from("destination_photos")
    .update({
      category,
      alt_text: typeof body.altText === "string" ? body.altText.trim() || null : existing.alt_text,
      sort_order: parseSortOrder(body.sortOrder),
      is_cover: shouldBeCover,
      updated_at: new Date().toISOString()
    })
    .eq("id", photoId)
    .eq("destination_id", id)
    .select("id,destination_id,image_url,category,alt_text,is_cover,sort_order,created_at,updated_at")
    .maybeSingle();

  if (error || !data) return NextResponse.json({ ok: false, message: error?.message ?? "图片保存失败。" }, { status: 500 });

  if (shouldBeCover) {
    const { error: clearCoverError } = await clearOtherCovers(supabase, id, photoId);
    if (clearCoverError) return NextResponse.json({ ok: false, message: `封面更新失败：${clearCoverError.message}` }, { status: 500 });
  }

  revalidateDestination(id);
  return NextResponse.json({ ok: true, photo: normalizePhoto(data as DestinationPhotoRow), message: shouldBeCover ? "已设为封面。" : "图片信息已保存。" });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; photoId: string }> }) {
  const { id, photoId } = await params;
  const { supabase, user, isAdmin } = await getRequestAuth(request);
  if (!user) return NextResponse.json({ ok: false, message: "请先登录。" }, { status: 401 });
  if (!isAdmin) return NextResponse.json({ ok: false, message: "你没有管理员权限。" }, { status: 403 });

  const existing = await requirePhoto(supabase, id, photoId);
  if (!existing) return NextResponse.json({ ok: false, message: "没有找到这张图片。" }, { status: 404 });

  const { error } = await supabase.from("destination_photos").delete().eq("id", photoId).eq("destination_id", id);
  if (error) return NextResponse.json({ ok: false, message: `图片删除失败：${error.message}` }, { status: 500 });

  revalidateDestination(id);
  return NextResponse.json({ ok: true, deletedId: photoId, message: "图片记录已删除，Storage 文件已保留。" });
}
