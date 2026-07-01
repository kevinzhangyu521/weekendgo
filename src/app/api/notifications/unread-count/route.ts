import { NextResponse } from "next/server";
import { getRequestAuth } from "@/lib/auth/request-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { supabase, user, authSource, isAdmin } = await getRequestAuth(request);
  if (!user) return NextResponse.json({ ok: true, unreadCount: 0, authSource });

  const userQuery = `user_id.eq.${user.id}`;
  const adminQuery = "role.eq.admin";
  const filter = isAdmin ? `${userQuery},${adminQuery}` : userQuery;

  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .or(filter)
    .eq("is_read", false);

  if (error) return NextResponse.json({ ok: false, unreadCount: 0, message: "\u8bfb\u53d6\u672a\u8bfb\u6d88\u606f\u5931\u8d25\u3002" }, { status: 500 });

  return NextResponse.json({ ok: true, unreadCount: count ?? 0, isAdmin, authSource });
}
