import { NextResponse } from "next/server";
import type { FeedbackItem, FeedbackStatus, FeedbackType } from "@/features/feedback/types";
import { getRequestAuth } from "@/lib/auth/request-auth";

type FeedbackRow = {
  id: string;
  feedback_no: string | null;
  user_id: string | null;
  type: FeedbackType;
  content: string;
  contact: string | null;
  page_url: string | null;
  device_type: string | null;
  user_agent: string | null;
  status: FeedbackStatus;
  admin_note: string | null;
  admin_reply: string | null;
  replied_at: string | null;
  status_changed_at: string | null;
  wechat_notify_reserved: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

type FeedbackUpdatePayload = {
  status: FeedbackStatus;
  admin_note: string | null;
  admin_reply: string | null;
  updated_at: string;
  replied_at?: string | null;
  status_changed_at?: string;
};

const feedbackStatuses = new Set<FeedbackStatus>(["pending", "in_progress", "accepted", "completed", "rejected"]);

const selectFields =
  "id,feedback_no,user_id,type,content,contact,page_url,device_type,user_agent,status,admin_note,admin_reply,replied_at,status_changed_at,wechat_notify_reserved,created_at,updated_at";

function normalize(row: FeedbackRow): FeedbackItem {
  return {
    id: row.id,
    feedbackNo: row.feedback_no,
    userId: row.user_id,
    type: row.type,
    content: row.content,
    contact: row.contact,
    pageUrl: row.page_url,
    deviceType: row.device_type,
    userAgent: row.user_agent,
    status: row.status,
    adminNote: row.admin_note,
    adminReply: row.admin_reply,
    repliedAt: row.replied_at,
    statusChangedAt: row.status_changed_at,
    wechatNotifyReserved: row.wechat_notify_reserved,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

async function requireBrowserAdmin(request: Request) {
  const auth = await getRequestAuth(request);
  if (!auth.user) return { ...auth, isAdmin: false };
  const { data } = await auth.supabase.from("admin_users").select("user_id").eq("user_id", auth.user.id).maybeSingle();
  return { ...auth, isAdmin: Boolean(data) };
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await context.params;
  const id = cleanText(rawId, 80);
  const { supabase, user, isAdmin } = await requireBrowserAdmin(request);

  if (!user) return NextResponse.json({ ok: false, message: "请先登录。" }, { status: 401 });
  if (!isAdmin) return NextResponse.json({ ok: false, message: "你没有管理员权限。" }, { status: 403 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const status = cleanText(body?.status, 50) as FeedbackStatus;
  const adminNote = cleanText(body?.adminNote, 1000);
  const adminReply = cleanText(body?.adminReply, 1000);

  if (!id) return NextResponse.json({ ok: false, message: "缺少反馈 ID。" }, { status: 400 });
  if (!feedbackStatuses.has(status)) return NextResponse.json({ ok: false, message: "状态不正确。" }, { status: 400 });

  const { data: existing, error: existingError } = await supabase
    .from("feedbacks")
    .select("status,admin_reply,replied_at")
    .eq("id", id)
    .maybeSingle();

  if (existingError) return NextResponse.json({ ok: false, message: `读取反馈失败：${existingError.message}` }, { status: 500 });
  if (!existing) return NextResponse.json({ ok: false, message: "反馈不存在。" }, { status: 404 });

  const now = new Date().toISOString();
  const statusChanged = existing.status !== status;
  const replyChanged = (existing.admin_reply ?? "") !== adminReply;
  const updatePayload: FeedbackUpdatePayload = {
    status,
    admin_note: adminNote || null,
    admin_reply: adminReply || null,
    updated_at: now,
    ...(replyChanged ? { replied_at: adminReply ? now : null } : {}),
    ...(statusChanged ? { status_changed_at: now } : {})
  };

  const { data, error } = await supabase.from("feedbacks").update(updatePayload).eq("id", id).select(selectFields).single();

  if (error || !data) return NextResponse.json({ ok: false, message: `更新失败：${error?.message ?? "未返回保存结果"}` }, { status: 500 });

  return NextResponse.json({
    ok: true,
    item: normalize(data as FeedbackRow),
    message: "反馈已更新。"
  });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await context.params;
  const id = cleanText(rawId, 80);
  const { supabase, user, isAdmin } = await requireBrowserAdmin(request);

  if (!user) return NextResponse.json({ ok: false, message: "请先登录。" }, { status: 401 });
  if (!isAdmin) return NextResponse.json({ ok: false, message: "你没有管理员权限。" }, { status: 403 });
  if (!id) return NextResponse.json({ ok: false, message: "缺少反馈 ID。" }, { status: 400 });

  const { error } = await supabase.from("feedbacks").delete().eq("id", id);

  if (error) return NextResponse.json({ ok: false, message: `删除失败：${error.message}` }, { status: 500 });

  return NextResponse.json({
    ok: true,
    deletedId: id,
    message: "反馈已删除。"
  });
}
