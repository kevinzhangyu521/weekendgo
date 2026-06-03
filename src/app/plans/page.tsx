import Link from "next/link";
import { CalendarDays, Route } from "lucide-react";
import { planStatusLabel } from "@/features/plans/presenter";
import { getMyPlans } from "@/features/plans/repository";
import { getLocale, pick } from "@/lib/i18n/server";

export default async function PlansPage() {
  const locale = await getLocale();
  const plans = await getMyPlans();

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <div className="mb-5">
          <p className="text-sm text-slate-500">{"\u6816\u7f8e\u5730"}</p>
          <h1 className="inline-flex items-center gap-2 text-2xl font-bold text-slate-900">
            <CalendarDays className="h-6 w-6 text-emerald-700" />
            {pick(locale, "My Plans", "\u6211\u7684\u8ba1\u5212")}
          </h1>
        </div>

        {plans.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-700">
            <p className="font-medium">{pick(locale, "No plans yet.", "\u8fd8\u6ca1\u6709\u8ba1\u5212\u3002")}</p>
            <p className="mt-1 text-sm text-slate-600">{pick(locale, "Add destinations from detail pages to build your first weekend route.", "\u4ece\u76ee\u7684\u5730\u8be6\u60c5\u9875\u6dfb\u52a0\u7ad9\u70b9\uff0c\u751f\u6210\u4f60\u7684\u7b2c\u4e00\u4e2a\u5468\u672b\u8def\u7ebf\u3002")}</p>
            <Link href="/destinations" className="mt-4 inline-flex rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white">
              {pick(locale, "Explore destinations", "\u53bb\u770b\u76ee\u7684\u5730")}
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan) => (
              <Link
                key={plan.id}
                href={`/plans/${plan.id}`}
                className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                <p className="text-base font-semibold text-slate-900">{plan.title}</p>
                <p className="mt-1 text-sm text-slate-600">{plan.planDate}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1">
                    <Route className="h-3.5 w-3.5" />
                    {pick(locale, `${plan.itemCount} stops`, `${plan.itemCount} \u4e2a\u7ad9\u70b9`)}
                  </span>
                  <div className="flex items-center gap-1">
                    {plan.isPublic ? <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">{pick(locale, "Public", "\u516c\u5f00")}</span> : null}
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
