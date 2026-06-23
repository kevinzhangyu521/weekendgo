import { NextResponse } from "next/server";
import { getRequestAuth } from "@/lib/auth/request-auth";

async function getAdminStatus(supabase: Awaited<ReturnType<typeof getRequestAuth>>["supabase"], userId: string) {
  const { data } = await supabase.from("admin_users").select("user_id").eq("user_id", userId).maybeSingle();
  return Boolean(data);
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PATCH(request: Request) {
  const { supabase, user, authSource } = await getRequestAuth(request);
  if (!user) return NextResponse.json({ ok: false, authSource, message: "\u8bf7\u5148\u767b\u5f55\u3002" }, { status: 401 });

  const isAdmin = await getAdminStatus(supabase, user.id);
  const userQuery = `user_id.eq.${user.id}`;
  const adminQuery = "role.eq.admin";
  const filter = isAdmin ? `${userQuery},${adminQuery}` : userQuery;
  const now = new Date().toISOString();

  const { error } = await supabase.from("notifications").update({ is_read: true, read_at: now }).or(filter).eq("is_read", false);

  if (error) return NextResponse.json({ ok: false, message: `\u5168\u90e8\u6807\u8bb0\u5df2\u8bfb\u5931\u8d25\uff1a${error.message}` }, { status: 500 });

  return NextResponse.json({ ok: true, readAt: now, isAdmin, authSource });
}
