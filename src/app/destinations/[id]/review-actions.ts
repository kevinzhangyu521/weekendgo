"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ReviewFormState = {
  ok: boolean;
  message: string;
};

export async function saveDestinationReview(_state: ReviewFormState, formData: FormData): Promise<ReviewFormState> {
  const destinationId = String(formData.get("destination_id") ?? "");
  const rating = Number(formData.get("rating") ?? 0);
  const content = String(formData.get("content") ?? "").trim();
  const visitDate = String(formData.get("visit_date") ?? "").trim() || null;

  if (!destinationId) return { ok: false, message: "\u7f3a\u5c11\u76ee\u7684\u5730\u4fe1\u606f\u3002" };
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { ok: false, message: "\u8bf7\u9009\u62e9 1-5 \u661f\u8bc4\u5206\u3002" };
  if (content.length < 4) return { ok: false, message: "\u8bf7\u81f3\u5c11\u5199 4 \u4e2a\u5b57\uff0c\u65b9\u4fbf\u5176\u4ed6\u5bb6\u5ead\u53c2\u8003\u3002" };
  if (content.length > 500) return { ok: false, message: "\u4f53\u9a8c\u5185\u5bb9\u8bf7\u63a7\u5236\u5728 500 \u5b57\u4ee5\u5185\u3002" };

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, message: "\u8bf7\u5148\u767b\u5f55\u540e\u518d\u63d0\u4ea4\u4f53\u9a8c\u3002" };

  const { error } = await supabase.from("destination_reviews").upsert(
    {
      destination_id: destinationId,
      user_id: user.id,
      rating,
      content,
      visit_date: visitDate,
      updated_at: new Date().toISOString()
    },
    { onConflict: "destination_id,user_id" }
  );

  if (error) return { ok: false, message: "\u63d0\u4ea4\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002" };

  revalidatePath(`/destinations/${destinationId}`);
  return { ok: true, message: "\u5df2\u63d0\u4ea4\uff0c\u611f\u8c22\u4f60\u7684\u771f\u5b9e\u4f53\u9a8c\u3002" };
}
