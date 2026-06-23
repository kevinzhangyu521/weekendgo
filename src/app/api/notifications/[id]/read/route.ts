import { NextResponse } from "next/server";
import { getRequestAuth } from "@/lib/auth/request-auth";

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await context.params;
  const id = cleanText(rawId, 80);
  const { supabase, user, authSource } = await getRequestAuth(request);

  if (!user) return NextResponse.json({ ok: false, authSource, message: "请先登录。" }, { status: 401 });
  if (!id) return NextResponse.json({ ok: false, message: "缺少消息 ID。" }, { status: 400 });

  const now = new Date().toISOString();
  const { error } = await supabase.from("notifications").update({ is_read: true, read_at: now }).eq("id", id);

  if (error) return NextResponse.json({ ok: false, message: `标记已读失败：${error.message}` }, { status: 500 });

  return NextResponse.json({ ok: true, readAt: now, authSource });
}
