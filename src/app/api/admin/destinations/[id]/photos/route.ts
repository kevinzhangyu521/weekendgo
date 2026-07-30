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

type UploadMetadata = {
  category: PhotoCategory;
  altText: string | null;
  sortOrder: number;
  isCover: boolean;
};

const categories = new Set<PhotoCategory>(["cover", "gallery", "play", "parking", "toilet", "food", "camping", "water"]);

export const dynamic = "force-dynamic";
export const revalidate = 0;

function safeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "");
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseMetadata(value: FormDataEntryValue | null, count: number): UploadMetadata[] {
  if (typeof value !== "string") {
    return Array.from({ length: count }, (_, index) => ({
      category: "gallery",
      altText: null,
      sortOrder: index,
      isCover: false
    }));
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    parsed = [];
  }

  const items = Array.isArray(parsed) ? parsed : [];
  const metadata = Array.from({ length: count }, (_, index) => {
    const item = items[index];
    const record = isRecord(item) ? item : {};
    const rawCategory = typeof record.category === "string" ? record.category : "gallery";
    const rawSortOrder = typeof record.sortOrder === "number" || typeof record.sortOrder === "string" ? Number(record.sortOrder) : index;
    const isCover = record.isCover === true;
    return {
      category: isCover ? "cover" : categories.has(rawCategory as PhotoCategory) ? (rawCategory as PhotoCategory) : "gallery",
      altText: typeof record.altText === "string" ? record.altText.trim() || null : null,
      sortOrder: Number.isFinite(rawSortOrder) ? Math.trunc(rawSortOrder) : index,
      isCover
    };
  });

  const coverIndex = metadata.findIndex((item) => item.isCover);
  if (coverIndex >= 0) {
    metadata.forEach((item, index) => {
      item.isCover = index === coverIndex;
      item.category = item.isCover ? "cover" : item.category === "cover" ? "gallery" : item.category;
    });
  }

  return metadata;
}

async function loadPhotos(supabase: SupabaseClient, destinationId: string) {
  const { data } = await supabase
    .from("destination_photos")
    .select("id,destination_id,image_url,category,alt_text,is_cover,sort_order,created_at,updated_at")
    .eq("destination_id", destinationId)
    .order("is_cover", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  return ((data ?? []) as DestinationPhotoRow[]).map(normalizePhoto);
}

function revalidateDestination(destinationId: string) {
  revalidateTag("destinations");
  revalidatePath("/admin/destinations");
  revalidatePath(`/admin/destinations/${destinationId}/edit`);
  revalidatePath("/destinations");
  revalidatePath(`/destinations/${destinationId}`);
  revalidatePath("/map");
}

async function keepSingleCover(supabase: SupabaseClient, destinationId: string, coverPhotoId: string) {
  return supabase
    .from("destination_photos")
    .update({ is_cover: false, updated_at: new Date().toISOString() })
    .eq("destination_id", destinationId)
    .neq("id", coverPhotoId)
    .eq("is_cover", true);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, isAdmin } = await getRequestAuth(request);
  if (!user) return NextResponse.json({ ok: false, message: "请先登录。" }, { status: 401 });
  if (!isAdmin) return NextResponse.json({ ok: false, message: "你没有管理员权限。" }, { status: 403 });

  const { data: destination } = await supabase.from("destinations").select("id").eq("id", id).maybeSingle();
  if (!destination) return NextResponse.json({ ok: false, message: "没有找到这个目的地。" }, { status: 404 });

  const formData = await request.formData();
  const files = formData.getAll("photos").filter((entry): entry is File => entry instanceof File && entry.size > 0 && entry.type.startsWith("image/"));
  if (files.length === 0) return NextResponse.json({ ok: false, message: "请选择要上传的图片。" }, { status: 400 });

  const metadata = parseMetadata(formData.get("metadata"), files.length);
  const errors: string[] = [];
  const insertedRows: DestinationPhotoRow[] = [];

  for (const [index, file] of files.entries()) {
    const path = `admin/destinations/${id}/${Date.now()}-${index}-${safeFileName(file.name) || "destination-photo.jpg"}`;
    const { error: uploadError } = await supabase.storage.from("spot-submission-photos").upload(path, file, {
      cacheControl: "3600",
      upsert: false
    });

    if (uploadError) {
      errors.push(`${file.name}: ${uploadError.message}`);
      continue;
    }

    const { data } = supabase.storage.from("spot-submission-photos").getPublicUrl(path);
    const item = metadata[index];
    const { data: inserted, error: insertError } = await supabase
      .from("destination_photos")
      .insert({
        destination_id: id,
        image_url: data.publicUrl,
        category: item.isCover ? "cover" : item.category,
        alt_text: item.altText,
        is_cover: item.isCover,
        sort_order: item.sortOrder
      })
      .select("id,destination_id,image_url,category,alt_text,is_cover,sort_order,created_at,updated_at")
      .maybeSingle();

    if (insertError || !inserted) {
      errors.push(`${file.name}: ${insertError?.message ?? "图片记录保存失败"}`);
      continue;
    }

    if (item.isCover) {
      const { error: coverError } = await keepSingleCover(supabase, id, inserted.id as string);
      if (coverError) errors.push(`${file.name}: 封面切换失败：${coverError.message}`);
    }

    insertedRows.push(inserted as DestinationPhotoRow);
  }

  if (insertedRows.length === 0) {
    return NextResponse.json({ ok: false, message: errors.length > 0 ? `图片上传失败：${errors.join("；")}` : "图片上传失败。", errors }, { status: 500 });
  }

  revalidateDestination(id);
  const photos = await loadPhotos(supabase, id);
  return NextResponse.json({
    ok: true,
    photos,
    errors,
    message: errors.length > 0 ? `已上传 ${insertedRows.length} 张，${errors.length} 张失败。` : "图片已上传。"
  });
}
