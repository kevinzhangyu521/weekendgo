import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type AddToPlanPayload = {
  destinationId?: string;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getNextSaturdayISO() {
  const now = new Date();
  const day = now.getDay();
  const diff = (6 - day + 7) % 7;
  now.setDate(now.getDate() + diff);
  return now.toISOString().slice(0, 10);
}

export async function POST(request: Request) {
  let payload: AddToPlanPayload = {};

  try {
    payload = (await request.json()) as AddToPlanPayload;
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
    return NextResponse.json({ ok: false, message: "请先登录后再加入计划。" }, { status: 401 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const { data: existingPlan } = await supabase
    .from("weekend_plans")
    .select("id,plan_date")
    .eq("user_id", user.id)
    .gte("plan_date", today)
    .order("plan_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  let planId = existingPlan?.id as string | undefined;
  if (!planId) {
    const { data: newPlan, error: createError } = await supabase
      .from("weekend_plans")
      .insert({
        user_id: user.id,
        title: "我的周末计划",
        plan_date: getNextSaturdayISO(),
        status: "draft"
      })
      .select("id")
      .single();

    if (createError || !newPlan) {
      return NextResponse.json({ ok: false, message: "创建计划失败。" }, { status: 500 });
    }

    planId = newPlan.id as string;
  }

  const { data: existingItem, error: existingItemError } = await supabase
    .from("plan_items")
    .select("id")
    .eq("plan_id", planId)
    .eq("destination_id", payload.destinationId)
    .maybeSingle();

  if (existingItemError) {
    return NextResponse.json({ ok: false, message: "读取计划失败。" }, { status: 500 });
  }

  if (existingItem) {
    return NextResponse.json({ ok: true, alreadyInPlan: true, planId, message: "已经在计划里。" });
  }

  const { data: itemRows } = await supabase
    .from("plan_items")
    .select("id,sort_order")
    .eq("plan_id", planId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextSort = (itemRows?.[0]?.sort_order ?? -1) + 1;
  const { error: insertError } = await supabase.from("plan_items").insert({
    plan_id: planId,
    destination_id: payload.destinationId,
    sort_order: nextSort
  });

  if (insertError) {
    return NextResponse.json({ ok: false, message: "加入计划失败。" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, alreadyInPlan: false, planId, message: "已加入计划。" });
}
