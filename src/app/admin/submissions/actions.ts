"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createNotification } from "@/features/notifications/create-notification";
import { getCurrentAuthWithAdmin } from "@/lib/auth/current-user";

export async function approveSubmission(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { supabase, user, isAdmin } = await getCurrentAuthWithAdmin();
  if (!user || !isAdmin) return;

  const { data: submission, error } = await supabase
    .from("spot_submissions")
    .select("*")
    .eq("id", id)
    .eq("status", "pending")
    .maybeSingle();

  if (error || !submission) return;

  const now = new Date().toISOString();
  const externalId = `submission-${submission.id}`;

  const { data: destination } = await supabase.from("destinations").upsert(
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
      ticket_price: submission.ticket_price ?? null,
      image: submission.image_url ?? "",
      description: submission.description,
      description_zh: submission.description_zh,
      updated_at: now
    },
    { onConflict: "external_id" }
  ).select("id").single();

  await supabase
    .from("spot_submissions")
    .update({
      status: "approved",
      published_destination_id: destination?.id ?? null,
      allow_resubmit: false,
      reviewed_by: user.id,
      reviewed_at: now,
      updated_at: now,
      review_note: "\u5ba1\u6838\u5df2\u901a\u8fc7\uff0c\u5730\u70b9\u5df2\u53d1\u5e03\u5230\u76ee\u7684\u5730\u5217\u8868\u3002"
    })
    .eq("id", id);

  await createNotification(supabase, {
    userId: submission.user_id,
    role: "user",
    type: "submission_approved",
    title: "\u6295\u7a3f\u5df2\u901a\u8fc7",
    content: `\u4f60\u63a8\u8350\u7684\u300c${submission.name_zh || submission.name}\u300d\u5df2\u5ba1\u6838\u901a\u8fc7\uff0c\u5730\u70b9\u5df2\u53d1\u5e03\u5230\u76ee\u7684\u5730\u5217\u8868\u3002`,
    relatedId: submission.id,
    relatedType: "submission"
  });

  revalidateTag("destinations");
  revalidatePath("/admin/submissions");
  revalidatePath("/my-submissions");
  revalidatePath("/notifications");
  revalidatePath("/destinations");
  revalidatePath("/map");
}

export async function requestChangesSubmission(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const note =
    String(formData.get("review_note") ?? "").trim() ||
    "\u8bf7\u8865\u5145\u66f4\u5b8c\u6574\u7684\u5730\u70b9\u4fe1\u606f\u3001\u73b0\u573a\u56fe\u7247\u6216\u5b89\u5168\u63d0\u793a\u540e\u518d\u6b21\u63d0\u4ea4\u3002";
  if (!id) return;

  const { supabase, user, isAdmin } = await getCurrentAuthWithAdmin();
  if (!user || !isAdmin) return;

  const { data: submission } = await supabase
    .from("spot_submissions")
    .select("id,user_id,name,name_zh")
    .eq("id", id)
    .maybeSingle();

  if (!submission) return;

  const now = new Date().toISOString();

  await supabase
    .from("spot_submissions")
    .update({
      status: "needs_changes",
      allow_resubmit: true,
      reviewed_by: user.id,
      reviewed_at: now,
      updated_at: now,
      review_note: note
    })
    .eq("id", id);

  await createNotification(supabase, {
    userId: submission.user_id,
    role: "user",
    type: "submission_needs_changes",
    title: "\u6295\u7a3f\u9700\u4fee\u6539",
    content: `\u4f60\u63d0\u4ea4\u7684\u300c${submission.name_zh || submission.name}\u300d\u9700\u8981\u8865\u5145\u4fe1\u606f\u540e\u518d\u5ba1\u6838\u3002\u5907\u6ce8\uff1a${note}`,
    relatedId: id,
    relatedType: "submission"
  });

  revalidatePath("/admin/submissions");
  revalidatePath("/my-submissions");
  revalidatePath("/notifications");
}

export async function rejectSubmission(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const note =
    String(formData.get("review_note") ?? "").trim() ||
    "\u672a\u901a\u8fc7\u5ba1\u6838\uff0c\u5efa\u8bae\u8865\u5145\u66f4\u6e05\u6670\u7684\u5730\u70b9\u4fe1\u606f\u3001\u5b89\u5168\u63d0\u793a\u6216\u73b0\u573a\u56fe\u7247\u540e\u518d\u6b21\u63d0\u4ea4\u3002";
  if (!id) return;

  const { supabase, user, isAdmin } = await getCurrentAuthWithAdmin();
  if (!user || !isAdmin) return;

  const { data: submission } = await supabase
    .from("spot_submissions")
    .select("id,user_id,name,name_zh")
    .eq("id", id)
    .maybeSingle();

  if (!submission) return;

  const now = new Date().toISOString();

  await supabase
    .from("spot_submissions")
    .update({
      status: "rejected",
      allow_resubmit: false,
      reviewed_by: user.id,
      reviewed_at: now,
      updated_at: now,
      review_note: note
    })
    .eq("id", id);

  await createNotification(supabase, {
    userId: submission.user_id,
    role: "user",
    type: "submission_rejected",
    title: "\u6295\u7a3f\u672a\u901a\u8fc7",
    content: `\u4f60\u63a8\u8350\u7684\u300c${submission.name_zh || submission.name}\u300d\u6682\u672a\u901a\u8fc7\u5ba1\u6838\u3002\u539f\u56e0\uff1a${note}`,
    relatedId: id,
    relatedType: "submission"
  });

  revalidatePath("/admin/submissions");
  revalidatePath("/my-submissions");
  revalidatePath("/notifications");
}
