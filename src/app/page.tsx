import Link from "next/link";
import { Baby, Search, Tent, TreePine, Waves } from "lucide-react";
import { DestinationCard } from "@/components/home/destination-card";
import { HomeSectionHeader } from "@/components/home/top10-carousel";
import { hasUsableDestinationImage } from "@/features/destinations/images";
import { getHomeRecommendedDestinations, getPublishedDestinations } from "@/features/destinations/repository";
import type { DestinationItem } from "@/features/destinations/types";
import { getMyProfile } from "@/features/profiles/repository";
import { DEFAULT_HOME_CITY, withDistanceFromCity } from "@/lib/geo/distance";
import type { Locale } from "@/lib/i18n/config";
import { getLocale, pick } from "@/lib/i18n/server";

const scenes = [
  { key: "camping", label: "Camping", labelZh: "\u9732\u8425", icon: Tent },
  { key: "creek", label: "Water", labelZh: "\u73a9\u6c34", icon: Waves },
  { key: "park", label: "Parks", labelZh: "\u516c\u56ed", icon: TreePine },
  { key: "family", label: "Family", labelZh: "\u4eb2\u5b50", icon: Baby }
] as const;

function destinationListHref(params: Record<string, string | number | boolean>) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => searchParams.set(key, String(value)));
  return `/destinations?${searchParams.toString()}`;
}

function EmptyState({ children }: { children: string }) {
  return (
    <div className="qmd-place-card flex min-h-[180px] items-center justify-center p-6 text-center text-sm font-semibold text-slate-500">
      {children}
    </div>
  );
}

function formatKm(distanceKm: number) {
  return Number.isInteger(distanceKm) ? `${distanceKm}` : distanceKm.toFixed(1);
}

function nearbyDistanceLine(item: DestinationItem, locale: Locale) {
  if (!item.distanceKm || item.distanceKm <= 0) return undefined;

  return pick(locale, `About ${formatKm(item.distanceKm)} km away`, `\ud83d\udccd \u8ddd\u79bb\u7ea6 ${formatKm(item.distanceKm)} km`);
}

function timestamp(item: DestinationItem) {
  const value = item.createdAt ?? item.updatedAt;
  if (!value) return 0;

  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function sortByPublishedTime(items: DestinationItem[]) {
  return [...items].sort((a, b) => timestamp(b) - timestamp(a));
}

function uniqueById(items: DestinationItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export default async function HomePage() {
  const [locale, profile, rawDestinations, todayRecommended, moreRecommended] = await Promise.all([
    getLocale(),
    getMyProfile(),
    getPublishedDestinations(),
    getHomeRecommendedDestinations("today_pick"),
    getHomeRecommendedDestinations("more_explore")
  ]);
  const zh = locale === "zh";
  const homeCity = profile?.homeCity?.trim() || DEFAULT_HOME_CITY;
  const heroPlayLinks = scenes.map((item) => ({
    key: item.key,
    label: zh ? item.labelZh : item.label,
    icon: item.icon,
    href:
      item.key === "family"
        ? destinationListHref({ city: homeCity, scenario: "all", difficulty: "easy", maxDistance: 80, needParking: true, needToilet: true })
        : destinationListHref({ city: homeCity, q: zh ? item.labelZh : item.label, scenario: item.key === "park" ? "all" : item.key, difficulty: "all", maxDistance: 120, needParking: false, needToilet: false })
  }));

  const allDestinations = withDistanceFromCity(rawDestinations, homeCity).filter((item) => hasUsableDestinationImage(item) && Boolean((item.descriptionZh || item.description).trim()));
  const recommendedToday = withDistanceFromCity(todayRecommended, homeCity).filter((item) => hasUsableDestinationImage(item) && Boolean((item.descriptionZh || item.description).trim()));
  const recommendedExplore = withDistanceFromCity(moreRecommended, homeCity).filter((item) => hasUsableDestinationImage(item) && Boolean((item.descriptionZh || item.description).trim()));
  const featuredDestination = recommendedToday[0] ?? null;
  const featuredIds = new Set(featuredDestination ? [featuredDestination.id] : []);
  const nearbyDestinations = allDestinations
    .filter((item) => !featuredIds.has(item.id))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 3);
  const shownIds = new Set([...featuredIds, ...nearbyDestinations.map((item) => item.id)]);
  const explorationDestinations =
    recommendedExplore.length > 0
      ? uniqueById(recommendedExplore).slice(0, 12)
      : uniqueById(sortByPublishedTime(allDestinations.filter((item) => !shownIds.has(item.id)))).slice(0, 12);

  return (
    <main className="min-h-screen bg-slate-50 pb-10">
      <section className="bg-white">
        <div className="qmd-container flex min-h-[180px] flex-col justify-center py-4 md:min-h-[200px]">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-black leading-tight tracking-[-0.03em] text-slate-950 md:text-5xl">
              {pick(locale, `${homeCity} \u00b7 Where to go this weekend?`, `${homeCity} \u00b7 \u8fd9\u4e2a\u5468\u672b\u53bb\u54ea\uff1f`)}
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-500 md:text-lg">
              {pick(locale, "Help families decide where to go this weekend.", "\u5e2e\u5bb6\u5ead\u8f7b\u677e\u51b3\u5b9a\u8fd9\u4e2a\u5468\u672b\u53bb\u54ea\u3002")}
            </p>
          </div>

          <form action="/destinations" className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
            <input type="hidden" name="city" value={homeCity} />
            <div className="flex h-12 min-w-0 items-center gap-3 rounded-full bg-slate-100 px-5">
              <Search className="h-5 w-5 shrink-0 text-slate-400" />
              <input name="q" type="search" placeholder={pick(locale, "Search camping, water, parks...", "\u641c\u7d22\u9732\u8425\u3001\u73a9\u6c34\u3001\u516c\u56ed\u2026\u2026")} className="min-w-0 flex-1 bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400" />
            </div>
            <button type="submit" className="interactive-button h-12 rounded-full bg-emerald-600 px-7 text-base font-bold text-white shadow-sm hover:bg-emerald-700">
              {pick(locale, "Search", "\u641c\u7d22")}
            </button>
          </form>

          <div className="mt-4 flex flex-wrap gap-3">
            {heroPlayLinks.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className="interactive-button inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm hover:border-emerald-500 hover:bg-emerald-600 hover:text-white"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="today-pick" className="qmd-container mt-6 scroll-mt-20 md:mt-8">
        <HomeSectionHeader
          title={pick(locale, "Today\u2019s Recommendation", "\u4eca\u65e5\u63a8\u8350")}
          locale={locale}
        />
        {featuredDestination ? (
          <DestinationCard item={featuredDestination} locale={locale} homeCity={homeCity} imagePriority featured />
        ) : (
          <EmptyState>{pick(locale, "No featured destination yet", "\u6682\u65e0\u63a8\u8350\u5185\u5bb9")}</EmptyState>
        )}
      </section>

      <section id="nearby" className="qmd-container qmd-section scroll-mt-20">
        <HomeSectionHeader
          title={pick(locale, "Nearby Recommendations", "\ud83d\udccd \u9644\u8fd1\u63a8\u8350")}
          subtitle={pick(locale, "Closer places, easier departures.", "\u79bb\u4f60\u66f4\u8fd1\uff0c\u51fa\u53d1\u66f4\u8f7b\u677e\u3002")}
          href={destinationListHref({ city: homeCity, scenario: "all", difficulty: "all", maxDistance: 50, needParking: false, needToilet: false })}
          locale={locale}
        />
        {nearbyDestinations.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {nearbyDestinations.map((item) => (
              <DestinationCard key={item.id} item={item} locale={locale} homeCity={homeCity} metaLine={nearbyDistanceLine(item, locale)} />
            ))}
          </div>
        ) : (
          <EmptyState>{pick(locale, "No nearby recommendations yet", "\u6682\u65e0\u9644\u8fd1\u63a8\u8350")}</EmptyState>
        )}
      </section>

      <section className="qmd-container qmd-section">
        <HomeSectionHeader
          title={pick(locale, "More to Explore", "\u66f4\u591a\u63a2\u7d22")}
          subtitle={pick(locale, "Discover more places for weekend departures.", "\u53d1\u73b0\u66f4\u591a\u9002\u5408\u5468\u672b\u51fa\u53d1\u7684\u5730\u65b9\u3002")}
          href={destinationListHref({ city: homeCity, scenario: "all", difficulty: "all", maxDistance: 120, needParking: false, needToilet: false })}
          locale={locale}
        />
        {explorationDestinations.length > 0 ? (
          <div className="columns-1 gap-5 md:columns-2 lg:columns-3">
            {explorationDestinations.map((item) => (
              <div key={item.id} className="mb-5 break-inside-avoid">
                <DestinationCard item={item} locale={locale} homeCity={homeCity} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState>{pick(locale, "No more destinations yet", "\u6682\u65e0\u66f4\u591a\u76ee\u7684\u5730")}</EmptyState>
        )}
      </section>

      <footer className="qmd-container mt-16 border-t border-slate-200 py-16 text-sm text-slate-500">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <p>{pick(locale, "Qimeide helps families find weekend outdoor places.", "\u5e2e\u4eb2\u5b50\u5bb6\u5ead\u53d1\u73b0\u5468\u672b\u6237\u5916\u76ee\u7684\u5730\u3002")}</p>
          <p>{pick(locale, "Camping \u00b7 Water play \u00b7 Parks \u00b7 Family trips", "\u9732\u8425 \u00b7 \u73a9\u6c34 \u00b7 \u516c\u56ed \u00b7 \u4eb2\u5b50\u51fa\u6e38")}</p>
        </div>
      </footer>
    </main>
  );
}
