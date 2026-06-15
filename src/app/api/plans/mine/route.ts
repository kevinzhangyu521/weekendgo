import { NextResponse } from "next/server";
import { getRequestAuth } from "@/lib/auth/request-auth";
import type { PlanSummary } from "@/features/plans/types";

type PlanRow = {
  id: string;
  title: string;
  plan_date: string;
  status: PlanSummary["status"];
  is_public: boolean;
  share_slug: string | null;
};

type PlanItemCountRow = {
  plan_id: string;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { supabase, user, authSource } = await getRequestAuth(request);

  if (!user) {
    return NextResponse.json({ ok: false, plans: [], authSource, message: "\u8bf7\u5148\u767b\u5f55\u540e\u518d\u67e5\u770b\u8ba1\u5212\u3002" }, { status: 401 });
  }

  const { data: plans, error } = await supabase
    .from("weekend_plans")
    .select("id,title,plan_date,status,is_public,share_slug")
    .eq("user_id", user.id)
    .order("plan_date", { ascending: false });

  if (error || !plans) {
    return NextResponse.json({ ok: false, plans: [], authSource, message: "\u8bfb\u53d6\u8ba1\u5212\u5931\u8d25\u3002" }, { status: 500 });
  }

  const rows = plans as PlanRow[];
  const planIds = rows.map((plan) => plan.id);
  const countMap = new Map<string, number>();

  if (planIds.length > 0) {
    const { data: items } = await supabase.from("plan_items").select("plan_id").in("plan_id", planIds);
    ((items ?? []) as PlanItemCountRow[]).forEach((item) => {
      countMap.set(item.plan_id, (countMap.get(item.plan_id) ?? 0) + 1);
    });
  }

  const summaries: PlanSummary[] = rows.map((plan) => ({
    id: plan.id,
    title: plan.title,
    planDate: plan.plan_date,
    status: plan.status,
    isPublic: plan.is_public,
    shareSlug: plan.share_slug,
    itemCount: countMap.get(plan.id) ?? 0
  }));

  return NextResponse.json({ ok: true, plans: summaries, authSource });
}
