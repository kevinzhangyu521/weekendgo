"use server";

import { revalidatePath } from "next/cache";
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
      review_note: "审核已通过，地点已发布到目的地列表。"
    })
    .eq("id", id);

  await supabase.from("user_notifications").insert({
    user_id: submission.user_id,
    type: "submission_approved",
    title: "推荐地点审核通过",
    body: `你推荐的「${submission.name_zh || submission.name}」已审核通过，地点已发布到目的地列表。`,
    href: "/my-submissions"
  });

  revalidatePath("/admin/submissions");
  revalidatePath("/my-submissions");
  revalidatePath("/destinations");
  revalidatePath("/map");
}

export async function rejectSubmission(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const note =
    String(formData.get("review_note") ?? "").trim() ||
    "未通过审核，建议补充更清晰的地点信息、安全提示或现场图片后再次提交。";
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
      title: "推荐地点未通过审核",
      body: `你推荐的「${submission.name_zh || submission.name}」暂未通过审核。原因：${note}`,
      href: "/my-submissions"
    });
  }

  revalidatePath("/admin/submissions");
  revalidatePath("/my-submissions");
}
