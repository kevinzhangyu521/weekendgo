import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ToggleFavoritePayload = {
  destinationId?: string;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  let payload: ToggleFavoritePayload = {};

  try {
    payload = (await request.json()) as ToggleFavoritePayload;
  } catch {
    return NextResponse.json({ ok: false, message: "请求格式不正确。" }, { status: 400 });
  }

  if (!payload.destinationId) {
    return NextResponse.json({ ok: false, message: "缺少目的地信息。" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, message: "请先登录后再收藏。" }, { status: 401 });
  }

  const { data: existing, error: existingError } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("destination_id", payload.destinationId)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ ok: false, message: "读取收藏状态失败。" }, { status: 500 });
  }

  if (existing) {
    const { error } = await supabase.from("favorites").delete().eq("id", existing.id);
    if (error) return NextResponse.json({ ok: false, message: "取消收藏失败。" }, { status: 500 });
    return NextResponse.json({ ok: true, isFavorite: false });
  }

  const { error } = await supabase.from("favorites").insert({
    user_id: user.id,
    destination_id: payload.destinationId
  });

  if (error) return NextResponse.json({ ok: false, message: "加入收藏失败。" }, { status: 500 });

  return NextResponse.json({ ok: true, isFavorite: true });
}
