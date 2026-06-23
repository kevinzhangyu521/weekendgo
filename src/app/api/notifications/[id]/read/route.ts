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

  if (!user) return NextResponse.json({ ok: false, authSource, message: "\u8bf7\u5148\u767b\u5f55\u3002" }, { status: 401 });
  if (!id) return NextResponse.json({ ok: false, message: "\u7f3a\u5c11\u6d88\u606f ID\u3002" }, { status: 400 });

  const now = new Date().toISOString();
  const { error } = await supabase.from("notifications").update({ is_read: true, read_at: now }).eq("id", id);

  if (error) return NextResponse.json({ ok: false, message: `\u6807\u8bb0\u5df2\u8bfb\u5931\u8d25\uff1a${error.message}` }, { status: 500 });

  return NextResponse.json({ ok: true, readAt: now, authSource });
}
