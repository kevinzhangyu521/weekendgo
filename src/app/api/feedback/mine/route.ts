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

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { supabase, user, authSource } = await getRequestAuth(request);
  if (!user) {
    return NextResponse.json({ ok: false, items: [], authSource, message: "请先登录后再查看我的反馈。" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("feedbacks")
    .select(selectFields)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !data) {
    return NextResponse.json({ ok: false, items: [], message: "读取我的反馈失败。" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, items: (data as FeedbackRow[]).map(normalize), authSource });
}
