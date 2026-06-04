"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function approveSubmission(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: submission, error } = await supabase
    .from("spot_submissions")
    .select("*")
    .eq("id", id)
    .eq("status", "pending")
    .maybeSingle();

  if (error || !submission) return;

  const externalId = `submission-${submission.id}`;
  await supabase.from("destinations").upsert(
    {
      external_id: externalId,
      name: submission.name,
      name_zh: submission.name_zh,
      province: submission.province,
      province_zh: submission.province_zh,
      city: submission.city,
      city_zh: submission.city_zh,
      latitude: submission.latitude ?? 0,
      longitude: submission.longitude ?? 0,
      scenario: submission.scenario,
      distance_km: submission.distance_km ?? 0,
      difficulty: submission.difficulty,
      safety: submission.safety,
      rating: 4.6,
      has_parking: submission.has_parking,
      has_toilet: submission.has_toilet,
      min_kid_age: submission.min_kid_age,
      image: submission.image_url ?? "",
      description: submission.description,
      description_zh: submission.description_zh,
      updated_at: new Date().toISOString()
    },
    { onConflict: "external_id" }
  );

  await supabase
    .from("spot_submissions")
    .update({
      status: "approved",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      review_note: "\u5ba1\u6838\u5df2\u901a\u8fc7\uff0c\u5730\u70b9\u5df2\u53d1\u5e03\u5230\u76ee\u7684\u5730\u5217\u8868\u3002"
    })
    .eq("id", id);

  await supabase.from("user_notifications").insert({
    user_id: submission.user_id,
    type: "submission_approved",
    title: "\u63a8\u8350\u5730\u70b9\u5ba1\u6838\u901a\u8fc7",
    body: `\u4f60\u63a8\u8350\u7684\u300c${submission.name_zh || submission.name}\u300d\u5df2\u5ba1\u6838\u901a\u8fc7\uff0c\u5730\u70b9\u5df2\u53d1\u5e03\u5230\u76ee\u7684\u5730\u5217\u8868\u3002`,
    href: "/my-submissions"
  });

  revalidateTag("destinations");
  revalidatePath("/admin/submissions");
  revalidatePath("/my-submissions");
  revalidatePath("/destinations");
  revalidatePath("/map");
}

export async function rejectSubmission(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const note =
    String(formData.get("review_note") ?? "").trim() ||
    "\u672a\u901a\u8fc7\u5ba1\u6838\uff0c\u5efa\u8bae\u8865\u5145\u66f4\u6e05\u6670\u7684\u5730\u70b9\u4fe1\u606f\u3001\u5b89\u5168\u63d0\u793a\u6216\u73b0\u573a\u56fe\u7247\u540e\u518d\u6b21\u63d0\u4ea4\u3002";
  if (!id) return;

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("spot_submissions")
    .update({
      status: "rejected",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      review_note: note
    })
    .eq("id", id);

  const { data: submission } = await supabase
    .from("spot_submissions")
    .select("user_id,name,name_zh")
    .eq("id", id)
    .maybeSingle();

  if (submission) {
    await supabase.from("user_notifications").insert({
      user_id: submission.user_id,
      type: "submission_rejected",
      title: "\u63a8\u8350\u5730\u70b9\u672a\u901a\u8fc7\u5ba1\u6838",
      body: `\u4f60\u63a8\u8350\u7684\u300c${submission.name_zh || submission.name}\u300d\u6682\u672a\u901a\u8fc7\u5ba1\u6838\u3002\u539f\u56e0\uff1a${note}`,
      href: "/my-submissions"
    });
  }

  revalidatePath("/admin/submissions");
  revalidatePath("/my-submissions");
}
