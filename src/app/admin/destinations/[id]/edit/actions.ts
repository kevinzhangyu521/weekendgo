"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/features/admin/permissions";

export async function updateDestination(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return;

  const name = String(formData.get("name") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!name || !city || !description) return;

  await supabase
    .from("destinations")
    .update({
      name,
      name_zh: String(formData.get("name_zh") ?? "").trim() || name,
      city,
      city_zh: String(formData.get("city_zh") ?? "").trim() || city,
      latitude: Number(formData.get("latitude") || "0") || 0,
      longitude: Number(formData.get("longitude") || "0") || 0,
      scenario: String(formData.get("scenario") ?? "creek"),
      difficulty: String(formData.get("difficulty") ?? "easy"),
      safety: String(formData.get("safety") ?? "low_risk"),
      distance_km: Number(formData.get("distance_km") || "0") || 0,
      rating: Number(formData.get("rating") || "0") || 0,
      has_parking: formData.get("has_parking") === "on",
      has_toilet: formData.get("has_toilet") === "on",
      min_kid_age: Number(formData.get("min_kid_age") || "0") || 0,
      image: String(formData.get("image") ?? "").trim(),
      description,
      description_zh: String(formData.get("description_zh") ?? "").trim() || description,
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
