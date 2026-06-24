import { NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return NextResponse.json({ ok: false, message: "缺少目的地 ID。" }, { status: 400 });

  const supabase = createPublicClient();
  const { error } = await supabase.rpc("increment_destination_share", { destination_id_input: id });
  if (error) return NextResponse.json({ ok: false, message: "分享记录失败。" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
