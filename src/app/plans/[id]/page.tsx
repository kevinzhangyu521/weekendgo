import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Route } from "lucide-react";
import { PlanEditor } from "@/components/plans/plan-editor";
import { planStatusLabel } from "@/features/plans/presenter";
import { getMyPlanById } from "@/features/plans/repository";
import { getLocale, pick } from "@/lib/i18n/server";

export default async function PlanDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const locale = await getLocale();
  const { id } = await params;
  const plan = await getMyPlanById(id);
  if (!plan) notFound();

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <Link href="/plans" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
          <ChevronLeft className="h-4 w-4" />
          {pick(locale, "Back to plans", "\u8fd4\u56de\u8ba1\u5212")}
        </Link>

        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-5">
          <h1 className="text-2xl font-bold text-slate-900">{plan.title}</h1>
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
      </section>
    </main>
  );
}
