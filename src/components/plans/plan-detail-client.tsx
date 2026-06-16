"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, Route } from "lucide-react";
import { PlanEditor } from "@/components/plans/plan-editor";
import { planStatusLabel } from "@/features/plans/presenter";
import { displayPlanTitle } from "@/features/plans/title";
import type { PlanDetail } from "@/features/plans/types";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import type { Locale } from "@/lib/i18n/config";
import { createClient } from "@/lib/supabase/client";

type Props = {
  id: string;
  locale: Locale;
};

type PlanResponse = {
  ok?: boolean;
  plan?: PlanDetail | null;
  message?: string;
};

function pick<T>(locale: Locale, en: T, zh: T): T {
  return locale === "zh" ? zh : en;
}

async function authHeaders() {
  const supabase = createClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();
  const headers: Record<string, string> = {};
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
  return headers;
}

export function PlanDetailClient({ id, locale }: Props) {
  const currentUser = useCurrentUser();
  const [plan, setPlan] = useState<PlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadPlan() {
      if (currentUser.isLoading) return;
      if (!currentUser.isAuthenticated) {
        setLoading(false);
        setError("");
        return;
      }

      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/plans/${id}`, {
          headers: await authHeaders(),
          credentials: "include",
          cache: "no-store"
        });
        const result = (await response.json()) as PlanResponse;
        if (!response.ok || !result.ok || !result.plan) throw new Error(result.message ?? "\u8bfb\u53d6\u8ba1\u5212\u5931\u8d25\u3002");
        if (mounted) setPlan(result.plan);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "\u8bfb\u53d6\u8ba1\u5212\u5931\u8d25\u3002");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadPlan();
    return () => {
      mounted = false;
    };
  }, [currentUser.isAuthenticated, currentUser.isLoading, id]);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <Link href="/plans" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
          <ChevronLeft className="h-4 w-4" />
          {pick(locale, "Back to plans", "\u8fd4\u56de\u8ba1\u5212")}
        </Link>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-700">{pick(locale, "Loading plan...", "\u6b63\u5728\u8bfb\u53d6\u8ba1\u5212...")}</div>
        ) : !currentUser.isAuthenticated ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-700">
            <p className="font-medium">{pick(locale, "Please sign in to view this plan.", "\u8bf7\u5148\u767b\u5f55\uff0c\u7136\u540e\u67e5\u770b\u8fd9\u4e2a\u8ba1\u5212\u3002")}</p>
            <Link href={`/login?next=${encodeURIComponent(`/plans/${id}`)}`} className="mt-4 inline-flex rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white">
              {pick(locale, "Sign in", "\u53bb\u767b\u5f55")}
            </Link>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
            <p>{error}</p>
            <Link href="/plans" className="mt-4 inline-flex rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white">
              {pick(locale, "Back to plans", "\u8fd4\u56de\u8ba1\u5212")}
            </Link>
          </div>
        ) : plan ? (
          <>
            <div className="mb-4 rounded-xl border border-slate-200 bg-white p-5">
              <h1 className="text-2xl font-bold text-slate-900">{displayPlanTitle(plan.title)}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <span>{plan.planDate}</span>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">{planStatusLabel(plan.status, locale)}</span>
                <span className="inline-flex items-center gap-1">
                  <Route className="h-4 w-4" />
                  {pick(locale, `${plan.items.length} stops`, `${plan.items.length} \u4e2a\u7ad9\u70b9`)}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500">{pick(locale, "Tip: enable public share in the editor below to get a read-only link.", "\u63d0\u793a\uff1a\u5728\u4e0b\u65b9\u7f16\u8f91\u533a\u5f00\u542f\u516c\u5f00\u5206\u4eab\uff0c\u5373\u53ef\u751f\u6210\u53ea\u8bfb\u94fe\u63a5\u3002")}</p>
              {plan.notes ? <p className="mt-3 text-sm text-slate-700">{plan.notes}</p> : null}
            </div>
            <PlanEditor plan={plan} locale={locale} />
          </>
        ) : null}
      </section>
    </main>
  );
}
