import { NextResponse } from "next/server";
import type { NotificationItem, NotificationRole } from "@/features/notifications/types";
import { getRequestAuth } from "@/lib/auth/request-auth";

type NotificationRow = {
  id: string;
  user_id: string | null;
  role: NotificationRole;
  type: string;
  title: string;
  content: string;
  related_id: string | null;
  related_type: string | null;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
};

const selectFields = "id,user_id,role,type,title,content,related_id,related_type,is_read,created_at,read_at";

function hrefFor(row: NotificationRow) {
  if (row.related_type === "feedback" && row.related_id) {
    return row.role === "admin" ? `/admin/feedback?feedbackId=${row.related_id}` : `/my-feedback?feedbackId=${row.related_id}`;
  }
  return row.role === "admin" ? "/admin/feedback" : "/my-feedback";
}

function normalize(row: NotificationRow): NotificationItem {
  return {
    id: row.id,
    userId: row.user_id,
    role: row.role,
    type: row.type,
    title: row.title,
    content: row.content,
    relatedId: row.related_id,
    relatedType: row.related_type,
    href: hrefFor(row),
    isRead: row.is_read,
    createdAt: row.created_at,
    readAt: row.read_at
  };
}

async function getAdminStatus(supabase: Awaited<ReturnType<typeof getRequestAuth>>["supabase"], userId: string) {
  const { data } = await supabase.from("admin_users").select("user_id").eq("user_id", userId).maybeSingle();
  return Boolean(data);
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { supabase, user, authSource } = await getRequestAuth(request);
  if (!user) return NextResponse.json({ ok: false, items: [], unreadCount: 0, authSource, message: "请先登录。" }, { status: 401 });

  const isAdmin = await getAdminStatus(supabase, user.id);
  const userQuery = `user_id.eq.${user.id}`;
  const adminQuery = "role.eq.admin";
  const filter = isAdmin ? `${userQuery},${adminQuery}` : userQuery;

  const { data, error } = await supabase
    .from("notifications")
    .select(selectFields)
    .or(filter)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !data) return NextResponse.json({ ok: false, items: [], unreadCount: 0, message: "读取消息失败。" }, { status: 500 });

  const items = (data as NotificationRow[]).map(normalize);
  return NextResponse.json({
    ok: true,
    items,
    unreadCount: items.filter((item) => !item.isRead).length,
    isAdmin,
    authSource
  });
}
