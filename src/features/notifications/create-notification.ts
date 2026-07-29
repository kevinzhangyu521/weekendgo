import type { SupabaseClient } from "@supabase/supabase-js";
import type { NotificationRole } from "./types";

export type CreateNotificationInput = {
  role: NotificationRole;
  userId?: string | null;
  type: string;
  title: string;
  content: string;
  relatedId?: string | null;
  relatedType?: string | null;
};

export type CreateNotificationResult = { ok: true } | { ok: false; message: string };

type NotificationInsertPayload = {
  user_id: string | null;
  role: NotificationRole;
  type: string;
  title: string;
  content: string;
  related_id: string | null;
  related_type: string | null;
};

function normalizeText(value: string, maxLength: number) {
  return value.trim().slice(0, maxLength);
}

export async function createNotification(supabase: SupabaseClient, input: CreateNotificationInput): Promise<CreateNotificationResult> {
  const role = input.role;
  const userId = input.userId?.trim() || null;

  if (role === "user" && !userId) {
    return { ok: false, message: "用户通知缺少 userId，已跳过创建。" };
  }

  const payload: NotificationInsertPayload = {
    user_id: role === "user" ? userId : null,
    role,
    type: normalizeText(input.type, 120),
    title: normalizeText(input.title, 200),
    content: normalizeText(input.content, 1000),
    related_id: input.relatedId?.trim() || null,
    related_type: input.relatedType?.trim() || null
  };

  if (!payload.type || !payload.title || !payload.content) {
    return { ok: false, message: "通知类型、标题和内容不能为空，已跳过创建。" };
  }

  try {
    const { error } = await supabase.from("notifications").insert(payload);
    if (error) return { ok: false, message: error.message };
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "通知创建失败。" };
  }
}
