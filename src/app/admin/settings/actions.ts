"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function claimFirstAdmin() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "请先登录后再设置管理员。" };
  }

  const { error } = await supabase.from("admin_users").insert({
    user_id: user.id,
    email: user.email ?? null
  });

  if (error) {
    return { ok: false, message: "设置失败：如果系统里已经存在管理员，需要由现有管理员操作，或在 Supabase 里手动恢复。" };
  }

  revalidatePath("/");
  revalidatePath("/admin/settings");
  return { ok: true, message: "管理员设置成功。请刷新页面后进入审核投稿或目的地管理。" };
}
