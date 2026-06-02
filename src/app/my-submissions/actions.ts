"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function getUserId() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return { supabase, userId: user?.id ?? null };
}

export async function lockSubmission(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { supabase, userId } = await getUserId();
  if (!userId) return;

  await supabase.from("spot_submissions").update({ is_locked: true, updated_at: new Date().toISOString() }).eq("id", id).eq("user_id", userId);
  revalidatePath("/my-submissions");
}

export async function unlockSubmission(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { supabase, userId } = await getUserId();
  if (!userId) return;

  await supabase.from("spot_submissions").update({ is_locked: false, updated_at: new Date().toISOString() }).eq("id", id).eq("user_id", userId);
  revalidatePath("/my-submissions");
}

export async function deleteSubmission(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { supabase, userId } = await getUserId();
  if (!userId) return;

  await supabase
    .from("spot_submissions")
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .eq("is_locked", false);
  revalidatePath("/my-submissions");
}

export async function restoreSubmission(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { supabase, userId } = await getUserId();
  if (!userId) return;

  await supabase.from("spot_submissions").update({ deleted_at: null, updated_at: new Date().toISOString() }).eq("id", id).eq("user_id", userId);
  revalidatePath("/my-submissions");
}
