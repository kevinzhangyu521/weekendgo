"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, Route } from "lucide-react";
import { planStatusLabel } from "@/features/plans/presenter";
import { displayPlanTitle } from "@/features/plans/title";
import type { PlanSummary } from "@/features/plans/types";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import type { Locale } from "@/lib/i18n/config";
import { createClient } from "@/lib/supabase/client";

type Props = {
  locale: Locale;
};

type PlansResponse = {
  ok?: boolean;
  plans?: PlanSummary[];
  message?: string;
};

function pick<T>(locale: Locale, en: T, zh: T): T {
  return locale === "zh" ? zh : en;
}

export function MyPlansClient({ locale }: Props) {
  const currentUser = useCurrentUser();
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadPlans() {
      if (currentUser.isLoading) return;

      if (!currentUser.isAuthenticated) {
        setPlans([]);
        setError("");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      const supabase = createClient();
      const {
        data: { session }
      } = await supabase.auth.getSession();

      const headers: Record<string, string> = {};
      if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;

      try {
        const response = await fetch("/api/plans/mine", {
          headers,
          credentials: "include",
          cache: "no-store"
        });
        const result = (await response.json()) as PlansResponse;
        if (!response.ok || !result.ok) throw new Error(result.message ?? "\u8bfb\u53d6\u8ba1\u5212\u5931\u8d25\u3002");
        if (!mounted) return;
        setPlans(result.plans ?? []);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "\u8bfb\u53d6\u8ba1\u5212\u5931\u8d25\u3002");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadPlans();

    return () => {
      mounted = false;
    };
  }, [currentUser.isAuthenticated, currentUser.isLoading]);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="qmd-container py-6">
        <div className="mb-5">
          <h1 className="inline-flex items-center gap-2 text-2xl font-bold text-slate-900">
            <CalendarDays className="h-6 w-6 text-emerald-700" />
            {pick(locale, "我的计划", "\u6211\u7684\u8ba1\u5212")}
          </h1>
        </div>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-700">{pick(locale, "正在读取计划...", "\u6b63\u5728\u8bfb\u53d6\u8ba1\u5212...")}</div>
        ) : !currentUser.isAuthenticated ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-700">
            <p className="font-medium">{pick(locale, "请先登录，然后查看你的计划。", "\u8bf7\u5148\u767b\u5f55\uff0c\u7136\u540e\u67e5\u770b\u4f60\u7684\u8ba1\u5212\u3002")}</p>
            <Link href="/login?next=%2Fplans" className="interactive-button mt-4 inline-flex rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
              {pick(locale, "登录查看", "\u767b\u5f55\u67e5\u770b")}
            </Link>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">{error}</div>
        ) : plans.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-700">
            <p className="font-medium">{pick(locale, "还没有计划。", "\u8fd8\u6ca1\u6709\u8ba1\u5212\u3002")}</p>
            <p className="mt-1 text-sm text-slate-600">{pick(locale, "从目的地详情页添加站点，生成你的第一个周末路线。", "\u4ece\u76ee\u7684\u5730\u8be6\u60c5\u9875\u6dfb\u52a0\u7ad9\u70b9\uff0c\u751f\u6210\u4f60\u7684\u7b2c\u4e00\u4e2a\u5468\u672b\u8def\u7ebf\u3002")}</p>
            <Link href="/destinations" className="interactive-button mt-4 inline-flex rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
              {pick(locale, "去看目的地", "\u53bb\u770b\u76ee\u7684\u5730")}
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan) => (
              <Link key={plan.id} href={`/plans/${plan.id}`} className="interactive-card block rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-base font-semibold text-slate-900">{displayPlanTitle(plan.title)}</p>
                <p className="mt-1 text-sm text-slate-600">{plan.planDate}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1">
                    <Route className="h-3.5 w-3.5" />
                    {pick(locale, `${plan.itemCount} 个站点`, `${plan.itemCount} \u4e2a\u7ad9\u70b9`)}
                  </span>
                  <div className="flex items-center gap-1">
                    {plan.isPublic ? <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">{pick(locale, "公开", "\u516c\u5f00")}</span> : null}
                    <span className="rounded-full bg-slate-100 px-2 py-1">{planStatusLabel(plan.status, locale)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
