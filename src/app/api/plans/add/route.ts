import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCurrentAuth } from "@/lib/auth/current-user";

type AddToPlanPayload = {
  destinationId?: string;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

const text = {
  badRequest: "\u8bf7\u6c42\u683c\u5f0f\u4e0d\u6b63\u786e\u3002",
  missingDestination: "\u7f3a\u5c11\u76ee\u7684\u5730\u4fe1\u606f\u3002",
  signInRequired: "\u8bf7\u5148\u767b\u5f55\u540e\u518d\u52a0\u5165\u8ba1\u5212\u3002",
  createFailed: "\u521b\u5efa\u8ba1\u5212\u5931\u8d25\u3002",
  readFailed: "\u8bfb\u53d6\u8ba1\u5212\u5931\u8d25\u3002",
  insertFailed: "\u52a0\u5165\u8ba1\u5212\u5931\u8d25\u3002",
  alreadyInPlan: "\u5df2\u7ecf\u5728\u8ba1\u5212\u91cc\u3002",
  added: "\u5df2\u52a0\u5165\u8ba1\u5212\u3002",
  defaultTitle: "\u6211\u7684\u5468\u672b\u8ba1\u5212"
};

function getNextSaturdayISO() {
  const now = new Date();
  const day = now.getDay();
  const diff = (6 - day + 7) % 7;
  now.setDate(now.getDate() + diff);
  return now.toISOString().slice(0, 10);
}

async function getAuthDiagnostic() {
  const cookieStore = await cookies();
  const cookieNames = cookieStore.getAll().map((cookie) => cookie.name).sort();
  return {
    hasSupabaseAuthCookie: cookieNames.some((name) => name.startsWith("sb-") && name.includes("auth-token")),
    cookiesReceived: cookieNames
  };
}

function authDiagnosticMessage(diagnostic: Awaited<ReturnType<typeof getAuthDiagnostic>>) {
  return `${text.signInRequired}诊断：Supabase Auth Cookie=${diagnostic.hasSupabaseAuthCookie ? "已收到" : "未收到"}`;
}

export async function POST(request: Request) {
  let payload: AddToPlanPayload = {};

  try {
    payload = (await request.json()) as AddToPlanPayload;
  } catch {
    return NextResponse.json({ ok: false, message: text.badRequest }, { status: 400 });
  }

  if (!payload.destinationId) {
    return NextResponse.json({ ok: false, message: text.missingDestination }, { status: 400 });
  }

  const { supabase, user } = await getCurrentAuth();

  if (!user) {
    const diagnostic = await getAuthDiagnostic();
    return NextResponse.json({ ok: false, message: authDiagnosticMessage(diagnostic), diagnostic }, { status: 401 });
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
        title: text.defaultTitle,
        plan_date: getNextSaturdayISO(),
        status: "draft"
      })
      .select("id")
      .single();

    if (createError || !newPlan) {
      return NextResponse.json({ ok: false, message: text.createFailed }, { status: 500 });
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
    return NextResponse.json({ ok: false, message: text.readFailed }, { status: 500 });
  }

  if (existingItem) {
    return NextResponse.json({ ok: true, alreadyInPlan: true, planId, message: text.alreadyInPlan });
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
    return NextResponse.json({ ok: false, message: text.insertFailed }, { status: 500 });
  }

  return NextResponse.json({ ok: true, alreadyInPlan: false, planId, message: text.added });
}
