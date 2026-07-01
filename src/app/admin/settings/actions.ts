"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAuth } from "@/lib/auth/current-user";

type ClaimAdminState = {
  ok: boolean;
  message: string;
};

export async function claimFirstAdmin(_state: ClaimAdminState, _formData: FormData): Promise<ClaimAdminState> {
  const { supabase, user } = await getCurrentAuth();

  if (!user) {
    return { ok: false, message: "\u8bf7\u5148\u767b\u5f55\u540e\u518d\u8bbe\u7f6e\u7ba1\u7406\u5458\u3002" };
  }

  const { data, error } = await supabase.rpc("claim_first_admin_profile");

  if (error || data !== true) {
    return { ok: false, message: "\u8bbe\u7f6e\u5931\u8d25\uff1a\u5982\u679c\u7cfb\u7edf\u91cc\u5df2\u7ecf\u5b58\u5728\u7ba1\u7406\u5458\uff0c\u9700\u8981\u7531\u73b0\u6709\u7ba1\u7406\u5458\u5904\u7406\u3002" };
  }

  revalidatePath("/");
  revalidatePath("/admin/settings");
  return { ok: true, message: "\u7ba1\u7406\u5458\u8bbe\u7f6e\u6210\u529f\u3002\u8bf7\u5237\u65b0\u9875\u9762\u540e\u7ee7\u7eed\u64cd\u4f5c\u3002" };
}
