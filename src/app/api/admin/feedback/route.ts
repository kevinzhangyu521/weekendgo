import { NextResponse } from "next/server";
import type { FeedbackItem, FeedbackStatus, FeedbackType } from "@/features/feedback/types";
import { createNotification } from "@/features/notifications/create-notification";
import { getRequestAuth } from "@/lib/auth/request-auth";

type FeedbackRow = {
  id: string;
  feedback_no: string | null;
  user_id: string | null;
  user_email: string | null;
  user_name: string | null;
  user_role: string | null;
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
const feedbackTypes = new Set<FeedbackType>(["bug", "place_error", "feature", "experience", "other"]);

const selectFields =
  "id,feedback_no,user_id,user_email,user_name,user_role,type,content,contact,page_url,device_type,user_agent,status,admin_note,admin_reply,replied_at,status_changed_at,wechat_notify_reserved,created_at,updated_at";

function normalize(row: FeedbackRow): FeedbackItem {
  return {
    id: row.id,
    feedbackNo: row.feedback_no,
    userId: row.user_id,
    userEmail: row.user_email,
    userName: row.user_name,
    userRole: row.user_role,
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
  return auth;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as FeedbackStatus | null;
  const type = searchParams.get("type") as FeedbackType | null;
  const q = searchParams.get("q")?.trim() ?? "";
  const { supabase, user, isAdmin, authSource } = await requireBrowserAdmin(request);

  if (!user) return NextResponse.json({ ok: false, items: [], authSource, message: "\u8bf7\u5148\u767b\u5f55\u3002" }, { status: 401 });
  if (!isAdmin) return NextResponse.json({ ok: false, items: [], authSource, message: "\u4f60\u6ca1\u6709\u7ba1\u7406\u5458\u6743\u9650\u3002" }, { status: 403 });

  let query = supabase.from("feedbacks").select(selectFields).order("created_at", { ascending: false }).limit(200);
  if (status && feedbackStatuses.has(status)) query = query.eq("status", status);
  if (type && feedbackTypes.has(type)) query = query.eq("type", type);
  if (q) query = query.or(`feedback_no.ilike.%${q}%,content.ilike.%${q}%,contact.ilike.%${q}%,page_url.ilike.%${q}%`);

  const { data, error } = await query;
  if (error || !data) return NextResponse.json({ ok: false, items: [], message: "\u8bfb\u53d6\u53cd\u9988\u5931\u8d25\u3002" }, { status: 500 });

  return NextResponse.json({
    ok: true,
    items: (data as FeedbackRow[]).map(normalize),
    authSource
  });
}

export async function PATCH(request: Request) {
  const { supabase, user, isAdmin } = await requireBrowserAdmin(request);
  if (!user) return NextResponse.json({ ok: false, message: "\u8bf7\u5148\u767b\u5f55\u3002" }, { status: 401 });
  if (!isAdmin) return NextResponse.json({ ok: false, message: "\u4f60\u6ca1\u6709\u7ba1\u7406\u5458\u6743\u9650\u3002" }, { status: 403 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const id = cleanText(body?.id, 80);
  const status = cleanText(body?.status, 50) as FeedbackStatus;
  const adminNote = cleanText(body?.adminNote, 1000);
  const adminReply = cleanText(body?.adminReply, 1000);

  if (!id) return NextResponse.json({ ok: false, message: "\u7f3a\u5c11\u53cd\u9988 ID\u3002" }, { status: 400 });
  if (!feedbackStatuses.has(status)) return NextResponse.json({ ok: false, message: "\u72b6\u6001\u4e0d\u6b63\u786e\u3002" }, { status: 400 });

  const { data: existing, error: existingError } = await supabase
    .from("feedbacks")
    .select("user_id,status,admin_reply,replied_at")
    .eq("id", id)
    .maybeSingle();

  if (existingError) return NextResponse.json({ ok: false, message: `\u8bfb\u53d6\u53cd\u9988\u5931\u8d25\uff1a${existingError.message}` }, { status: 500 });
  if (!existing) return NextResponse.json({ ok: false, message: "\u53cd\u9988\u4e0d\u5b58\u5728\u3002" }, { status: 404 });

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
  if (error || !data) return NextResponse.json({ ok: false, message: `\u66f4\u65b0\u5931\u8d25\uff1a${error?.message ?? "\u672a\u8fd4\u56de\u4fdd\u5b58\u7ed3\u679c"}` }, { status: 500 });

  if (existing.user_id && adminReply && (replyChanged || statusChanged) && (status === "accepted" || status === "completed")) {
    await createNotification(supabase, {
      userId: existing.user_id,
      role: "user",
      type: "feedback_replied",
      title: "\u4f60\u7684\u53cd\u9988\u5df2\u5904\u7406",
      content: "\u7ba1\u7406\u5458\u5df2\u56de\u590d\u4f60\u7684\u53cd\u9988\uff0c\u8bf7\u67e5\u770b\u5904\u7406\u7ed3\u679c\u3002",
      relatedId: id,
      relatedType: "feedback"
    });
  }

  return NextResponse.json({
    ok: true,
    item: normalize(data as FeedbackRow),
    message: "\u53cd\u9988\u5df2\u66f4\u65b0\u3002"
  });
}
