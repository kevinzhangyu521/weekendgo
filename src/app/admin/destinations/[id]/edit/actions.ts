"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/features/admin/permissions";

export type UpdateDestinationState = {
  ok: boolean;
  message: string;
};

function safeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "");
}

async function uploadImage(file: File | null) {
  if (!file || file.size === 0) return null;
  if (!file.type.startsWith("image/")) return null;

  const { supabase } = await requireAdmin();
  const path = `admin/${Date.now()}-${safeFileName(file.name) || "destination-photo.jpg"}`;
  const { error } = await supabase.storage.from("spot-submission-photos").upload(path, file, {
    cacheControl: "3600",
    upsert: false
  });
  if (error) return null;

  const { data } = supabase.storage.from("spot-submission-photos").getPublicUrl(path);
  return data.publicUrl;
}

export async function saveDestination(_state: UpdateDestinationState, formData: FormData): Promise<UpdateDestinationState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, message: "\u7f3a\u5c11\u76ee\u7684\u5730 ID\uff0c\u65e0\u6cd5\u4fdd\u5b58\u3002" };

  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return { ok: false, message: "\u4f60\u6ca1\u6709\u7ba1\u7406\u5458\u6743\u9650\u3002" };

  const name = String(formData.get("name") ?? "").trim();
  const province = String(formData.get("province") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const imageEntry = formData.get("image_file");
  const imageFile = imageEntry instanceof File ? imageEntry : null;

  if (!name || !province || !city || !description) return { ok: false, message: "\u8bf7\u586b\u5199\u540d\u79f0\u3001\u7701\u4efd\u3001\u57ce\u5e02\u548c\u63cf\u8ff0\u3002" };
  const imageUrl = await uploadImage(imageFile);

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
      ticket_price: String(formData.get("ticket_price") ?? "").trim() || null,
      ...(imageUrl ? { image: imageUrl } : {}),
      description,
      description_zh: description,
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) return { ok: false, message: `\u4fdd\u5b58\u5931\u8d25\uff1a${error.message}` };

  revalidateTag("destinations");
  revalidatePath("/admin/destinations");
  revalidatePath(`/admin/destinations/${id}/edit`);
  revalidatePath("/destinations");
  revalidatePath(`/destinations/${id}`);
  revalidatePath("/map");
  revalidatePath("/favorites");
  revalidatePath("/plans");
  return { ok: true, message: "\u4fdd\u5b58\u6210\u529f\uff0c\u6b63\u5728\u8fd4\u56de\u76ee\u7684\u5730\u7ba1\u7406\u9875..." };
}
