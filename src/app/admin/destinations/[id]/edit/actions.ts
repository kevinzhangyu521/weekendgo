"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/features/admin/permissions";

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

export async function updateDestination(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return;

  const name = String(formData.get("name") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const imageEntry = formData.get("image_file");
  const imageFile = imageEntry instanceof File ? imageEntry : null;

  if (!name || !city || !description) return;
  const imageUrl = await uploadImage(imageFile);

  await supabase
    .from("destinations")
    .update({
      name,
      name_zh: name,
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

  revalidatePath("/admin/destinations");
  revalidatePath(`/admin/destinations/${id}/edit`);
  revalidatePath("/destinations");
  revalidatePath(`/destinations/${id}`);
  revalidatePath("/map");
  revalidatePath("/favorites");
  revalidatePath("/plans");
  redirect("/admin/destinations");
}
