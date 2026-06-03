"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function safeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "");
}

async function uploadImage(userId: string, file: File | null) {
  if (!file || file.size === 0) return null;
  if (!file.type.startsWith("image/")) throw new Error("\u8bf7\u4e0a\u4f20\u56fe\u7247\u6587\u4ef6\u3002");

  const supabase = await createClient();
  const path = `${userId}/${Date.now()}-${safeFileName(file.name) || "spot-photo.jpg"}`;
  const { error } = await supabase.storage.from("spot-submission-photos").upload(path, file, {
    cacheControl: "3600",
    upsert: false
  });
  if (error) throw new Error("\u56fe\u7247\u4e0a\u4f20\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002");

  const { data } = supabase.storage.from("spot-submission-photos").getPublicUrl(path);
  return data.publicUrl;
}

export async function updateSubmission(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/my-submissions/${id}/edit`);

  const name = String(formData.get("name") ?? "").trim();
  const province = String(formData.get("province") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const descriptionZh = String(formData.get("description_zh") ?? "").trim();
  const imageEntry = formData.get("image_file");
  const imageFile = imageEntry instanceof File ? imageEntry : null;

  if (!name || !province || !city || !description) return;

  const imageUrl = await uploadImage(user.id, imageFile);
  const payload = {
    name,
    name_zh: name,
    province,
    province_zh: province,
    city,
    city_zh: city,
    address: String(formData.get("address") ?? "").trim() || null,
    latitude: Number(formData.get("latitude") || "0") || null,
    longitude: Number(formData.get("longitude") || "0") || null,
    scenario: String(formData.get("scenario") ?? "creek"),
    difficulty: String(formData.get("difficulty") ?? "easy"),
    safety: String(formData.get("safety") ?? "low_risk"),
    distance_km: 0,
    min_kid_age: Number(formData.get("min_kid_age") || "0"),
    has_parking: formData.get("has_parking") === "on",
    has_toilet: formData.get("has_toilet") === "on",
    ...(imageUrl ? { image_url: imageUrl } : {}),
    description,
    description_zh: descriptionZh || description,
    status: "pending",
    review_note: null,
    reviewed_by: null,
    reviewed_at: null,
    updated_at: new Date().toISOString()
  };

  await supabase
    .from("spot_submissions")
    .update(payload)
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("is_locked", false)
    .is("deleted_at", null)
    .neq("status", "approved");

  redirect("/my-submissions");
}
