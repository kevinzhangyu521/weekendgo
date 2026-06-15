import { NextResponse } from "next/server";
import { getRequestAuth } from "@/lib/auth/request-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  const { supabase, user } = await getRequestAuth(request);
  if (!user) return NextResponse.json({ ok: false, message: "\u8bf7\u5148\u767b\u5f55\u3002" }, { status: 401 });

  const body = (await request.json()) as { id?: string; action?: "lock" | "unlock" | "delete" | "restore" };
  if (!body.id || !body.action) return NextResponse.json({ ok: false, message: "\u8bf7\u6c42\u683c\u5f0f\u4e0d\u6b63\u786e\u3002" }, { status: 400 });

  const updatedAt = new Date().toISOString();
  let query;
  if (body.action === "lock") {
    query = supabase.from("spot_submissions").update({ is_locked: true, updated_at: updatedAt }).eq("id", body.id).eq("user_id", user.id);
  } else if (body.action === "unlock") {
    query = supabase.from("spot_submissions").update({ is_locked: false, updated_at: updatedAt }).eq("id", body.id).eq("user_id", user.id);
  } else if (body.action === "delete") {
    query = supabase.from("spot_submissions").update({ deleted_at: updatedAt, updated_at: updatedAt }).eq("id", body.id).eq("user_id", user.id).eq("is_locked", false);
  } else {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    query = supabase.from("spot_submissions").update({ deleted_at: null, updated_at: updatedAt }).eq("id", body.id).eq("user_id", user.id).gt("deleted_at", cutoff);
  }

  const { error } = await query;
  if (error) return NextResponse.json({ ok: false, message: "\u64cd\u4f5c\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002" }, { status: 500 });
  return NextResponse.json({ ok: true, message: "\u64cd\u4f5c\u6210\u529f\u3002" });
}
