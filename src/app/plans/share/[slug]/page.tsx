import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, MapPinned, Route, Share2, Star } from "lucide-react";
import { destinationName, destinationRegion, destinationScenario } from "@/features/destinations/presenter";
import { getPublicPlanBySlug } from "@/features/plans/repository";
import { displayPlanTitle } from "@/features/plans/title";
import type { PlanDetail } from "@/features/plans/types";
import { getCurrentUser } from "@/lib/auth/current-user";
import { DEFAULT_HOME_CITY, withDistanceFromCity } from "@/lib/geo/distance";
import { getAmapNavigationUrl } from "@/lib/maps/navigation";
import { getLocale, pick } from "@/lib/i18n/server";

function formatDistance(distanceKm: number, locale: "en" | "zh") {
  if (!distanceKm || distanceKm <= 0) return pick(locale, "Distance pending", "\u8ddd\u79bb\u5f85\u8ba1\u7b97");
  return pick(locale, `About ${distanceKm}km away`, `\u7ea6 ${distanceKm}km`);
}

function withPlanDistances(plan: PlanDetail): PlanDetail {
  const destinations = plan.items
    .map((item) => item.destination)
    .filter((item): item is NonNullable<PlanDetail["items"][number]["destination"]> => item !== null);
  const distanceMap = new Map(withDistanceFromCity(destinations, DEFAULT_HOME_CITY).map((item) => [item.id, item]));

  return {
    ...plan,
    items: plan.items.map((item) => ({
      ...item,
      destination: item.destination ? distanceMap.get(item.destination.id) ?? item.destination : null
    }))
  };
}

export default async function SharedPlanPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getLocale();
  const isZh = locale === "zh";
  const { slug } = await params;
  const query = await searchParams;
  const cardView = String(query.view ?? "") === "card";
  const rawPlan = await getPublicPlanBySlug(slug);
  if (!rawPlan) notFound();
  const plan = withPlanDistances(rawPlan);
  const user = await getCurrentUser();
  const isSignedIn = Boolean(user);

  return (
    <main className={`min-h-screen bg-slate-50 ${cardView ? "py-8" : ""}`}>
      <section className={`mx-auto px-4 md:px-6 ${cardView ? "max-w-3xl" : "max-w-5xl py-6"}`}>
        {!cardView ? (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 no-print">
            <Link href="/plans" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700">
              {pick(locale, "Back to plans", "\u8fd4\u56de\u8ba1\u5212")}
            </Link>
            <Link
              href={`/plans/share/${slug}?view=card`}
              className="rounded-full bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white"
            >
              {pick(locale, "Open card view", "\u6253\u5f00\u5361\u7247\u89c6\u56fe")}
            </Link>
          </div>
        ) : null}

        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm print-card">
          <h1 className="text-2xl font-bold text-slate-900">{displayPlanTitle(plan.title)}</h1>

          <div className={`mt-3 grid gap-2 text-sm text-slate-600 ${cardView ? "grid-cols-2" : "md:grid-cols-3"}`}>
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              {plan.planDate}
            </span>
            <span className="inline-flex items-center gap-1">
              <Route className="h-4 w-4" />
              {pick(locale, `${plan.items.length} stops`, `${plan.items.length} \u4e2a\u7ad9\u70b9`)}
            </span>
            {!cardView ? (
              <span className="inline-flex items-center gap-1">
                <Share2 className="h-4 w-4" />
                {pick(locale, "Read-only view", "\u53ea\u8bfb\u89c6\u56fe")}
              </span>
            ) : null}
          </div>

          {plan.notes ? <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{plan.notes}</p> : null}
        </div>

        {!cardView ? (
          <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm print-card">
            <p className="font-medium text-slate-900">{pick(locale, "Quick checklist", "\u51fa\u53d1\u6e05\u5355")}</p>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              <p>{pick(locale, "1. Water, sunscreen, and first-aid kit", "1. \u996e\u7528\u6c34\u3001\u9632\u6652\u548c\u6025\u6551\u5305")}</p>
              <p>{pick(locale, "2. Kids anti-slip shoes for creek sections", "2. \u6d89\u6c34\u8def\u6bb5\u4e3a\u5b69\u5b50\u51c6\u5907\u9632\u6ed1\u978b")}</p>
              <p>{pick(locale, "3. Backup clothes and towels", "3. \u5907\u7528\u8863\u7269\u4e0e\u6bdb\u5dfe")}</p>
              <p>{pick(locale, "4. Confirm weather before departure", "4. \u51fa\u53d1\u524d\u518d\u786e\u8ba4\u5929\u6c14")}</p>
            </div>
          </div>
        ) : null}

        <div className="space-y-3">
          {plan.items.map((item, index) => (
            <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm print-card">
              <div className="flex items-start gap-3">
                <span className="mt-1 inline-block h-4 w-4 rounded-sm border border-slate-400" />
                <div className="w-full">
                  <p className="text-xs text-slate-500">{isZh ? `\u7ad9\u70b9 ${index + 1}` : `Stop ${index + 1}`}</p>
                  {item.destination ? (
                    <>
                      <div className="mt-1 flex items-center justify-between gap-3">
                        <h2 className="text-base font-semibold text-slate-900">{destinationName(item.destination, locale)}</h2>
                        <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                          <Star className="h-3.5 w-3.5 fill-current text-amber-500" />
                          {item.destination.rating.toFixed(1)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">
                        {destinationRegion(item.destination, locale)} - {formatDistance(item.destination.distanceKm, locale)}
                      </p>
                      <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-600">
                        <MapPinned className="h-3.5 w-3.5" />
                        {destinationScenario(item.destination, locale)}
                      </p>
                      {!cardView ? (
                        <div className="mt-2 flex flex-wrap gap-2 no-print">
                          {isSignedIn ? (
                            <a
                              href={getAmapNavigationUrl(item.destination)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex rounded-full bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white"
                            >
                              {pick(locale, "Navigate", "\u7acb\u5373\u5bfc\u822a")}
                            </a>
                          ) : (
                            <Link
                              href={`/login?next=${encodeURIComponent(`/plans/share/${slug}`)}`}
                              className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700"
                            >
                              {pick(locale, "Sign in to navigate", "\u767b\u5f55\u540e\u5bfc\u822a")}
                            </Link>
                          )}
                          <Link
                            href={`/destinations/${item.destination.id}`}
                            className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700"
                          >
                            {pick(locale, "Open destination", "\u6253\u5f00\u76ee\u7684\u5730")}
                          </Link>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <p className="mt-1 text-sm text-slate-600">{pick(locale, "Destination not available", "\u76ee\u7684\u5730\u6682\u4e0d\u53ef\u7528")}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
