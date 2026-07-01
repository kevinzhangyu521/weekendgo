import Link from "next/link";
import {
  Baby,
  Search,
  Tent,
  TreePine,
  Waves
} from "lucide-react";
import { DestinationCard } from "@/components/home/destination-card";
import { HomeSectionHeader } from "@/components/home/top10-carousel";
import { hasUsableDestinationImage } from "@/features/destinations/images";
import {
  destinationName
} from "@/features/destinations/presenter";
import { getPublishedDestinations } from "@/features/destinations/repository";
import type { DestinationItem, Scenario } from "@/features/destinations/types";
import { getMyProfile } from "@/features/profiles/repository";
import { getLatestDestinationReviews } from "@/features/reviews/repository";
import type { DestinationReview } from "@/features/reviews/types";
import { DEFAULT_HOME_CITY, withDistanceFromCity } from "@/lib/geo/distance";
import type { Locale } from "@/lib/i18n/config";
import { getLocale, pick } from "@/lib/i18n/server";

const scenes = [
  { key: "camping", label: "Camping", labelZh: "露营", icon: Tent },
  { key: "creek", label: "Water", labelZh: "玩水", icon: Waves }
] as const;

function shortText(text: string, maxLength = 80) {
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}...` : normalized;
}

function formatShareTime(value: string, locale: Locale) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function reviewAvatarLabel(review: DestinationReview, locale: Locale) {
  const name = review.userName?.trim();
  if (name) return name.slice(0, 1).toUpperCase();
  return locale === "zh" ? "亲" : "U";
}

function ReviewAvatar({ review, locale }: { review: DestinationReview; locale: Locale }) {
  if (review.userAvatarUrl) {
    return (
      <img
        src={review.userAvatarUrl}
        alt={review.userName || pick(locale, "User avatar", "用户头像")}
        className="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-slate-100"
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-sky-100 text-base font-black text-emerald-800">
      {reviewAvatarLabel(review, locale)}
    </div>
  );
}

function isNearHomeCity(item: DestinationItem, homeCity: string) {
  const cityText = `${item.city} ${item.cityZh ?? ""} ${item.province ?? ""} ${item.provinceZh ?? ""}`;
  return cityText.includes(homeCity) || cityText.includes("Wuhan");
}

function worthScore(item: DestinationItem) {
  const easyBonus = item.difficulty === "easy" ? 0.8 : item.difficulty === "moderate" ? 0.35 : 0;
  const safetyBonus = item.safety === "low_risk" ? 0.8 : item.safety === "medium_risk" ? 0.25 : 0;
  const facilityBonus = (item.hasParking ? 0.2 : 0) + (item.hasToilet ? 0.2 : 0);
  const ageBonus = item.minKidAge <= 3 ? 0.35 : 0;
  return item.rating + easyBonus + safetyBonus + facilityBonus + ageBonus;
}

function sortByWorth(items: DestinationItem[]) {
  return [...items].sort((a, b) => worthScore(b) - worthScore(a));
}

function getTopDestinations(items: DestinationItem[], homeCity: string) {
  const nearby = sortByWorth(items.filter((item) => isNearHomeCity(item, homeCity)));
  const rest = sortByWorth(items.filter((item) => !nearby.some((nearbyItem) => nearbyItem.id === item.id)));
  return [...nearby, ...rest].slice(0, 10);
}

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

  return pick(locale, `About ${formatKm(item.distanceKm)} km away`, `📍 距离约 ${formatKm(item.distanceKm)} km`);
}

export default async function HomePage() {
  const [locale, profile, rawDestinations] = await Promise.all([getLocale(), getMyProfile(), getPublishedDestinations()]);
  const zh = locale === "zh";
  const homeCity = profile?.homeCity?.trim() || DEFAULT_HOME_CITY;
  const preferredScenarios = profile?.preferredScenarios ?? [];
  const heroPlayLinks = [
    ...scenes.map((item) => ({
      key: item.key,
      label: zh ? item.labelZh : item.label,
      icon: item.icon,
      href: destinationListHref({ scenario: item.key, difficulty: "all", maxDistance: 120, needParking: false, needToilet: false })
    })),
    {
      key: "park",
      label: pick(locale, "Parks", "公园"),
      icon: TreePine,
      href: destinationListHref({ city: homeCity, q: pick(locale, "park", "公园"), scenario: "all", difficulty: "all", maxDistance: 120, needParking: false, needToilet: false })
    },
    {
      key: "young-kids",
      label: pick(locale, "Family", "亲子"),
      icon: Baby,
      href: destinationListHref({ city: homeCity, scenario: "all", difficulty: "easy", maxDistance: 80, needParking: true, needToilet: true })
    }
  ];
  const allDestinations = withDistanceFromCity(rawDestinations, homeCity).filter((item) => hasUsableDestinationImage(item) && Boolean((item.descriptionZh || item.description).trim()));
  const destinationIds = allDestinations.map((item) => item.id);
  const topDestinations = getTopDestinations(allDestinations, homeCity);
  const todayPicks = topDestinations.slice(0, 3);
  const todayPickIds = new Set(todayPicks.map((item) => item.id));
  const weatherScenario = preferredScenarios[0] ?? topDestinations.find((item) => !todayPickIds.has(item.id))?.scenario;
  const weatherDestinations = allDestinations
    .filter((item) => item.scenario === weatherScenario && !todayPickIds.has(item.id))
    .sort((a, b) => worthScore(b) - worthScore(a))
    .slice(0, 3);
  const usedDestinationIds = new Set([...todayPicks, ...weatherDestinations].map((item) => item.id));
  const nearbyDestinations = allDestinations
    .filter((item) => !usedDestinationIds.has(item.id))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 4);
  const latestReviews = await getLatestDestinationReviews(destinationIds, 4);
  const destinationsById = new Map(allDestinations.map((item) => [item.id, item]));

  return (
    <main className="min-h-screen bg-slate-50 pb-10">
      <section className="bg-white">
        <div className="qmd-container flex min-h-[180px] flex-col justify-center py-4 md:min-h-[200px]">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-black leading-tight tracking-[-0.03em] text-slate-950 md:text-5xl">
              {pick(locale, `${city} · Where to go this weekend?`, `${homeCity} · 这个周末去哪？`)}
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-500 md:text-lg">
              {pick(locale, "Help families decide where to go this weekend.", "帮家庭轻松决定这个周末去哪。")}
            </p>
          </div>

          <form action="/destinations" className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
            <input type="hidden" name="city" value={homeCity} />
            <div className="flex h-12 min-w-0 items-center gap-3 rounded-full bg-slate-100 px-5">
              <Search className="h-5 w-5 shrink-0 text-slate-400" />
              <input name="q" type="search" placeholder={pick(locale, "Search camping, water, parks...", "搜索露营、玩水、公园……")} className="min-w-0 flex-1 bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400" />
            </div>
            <button type="submit" className="interactive-button h-12 rounded-full bg-emerald-600 px-7 text-base font-bold text-white shadow-sm hover:bg-emerald-700">
              {pick(locale, "Search", "搜索")}
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

      <section id="today-picks" className="qmd-container mt-6 scroll-mt-20 md:mt-8">
        <HomeSectionHeader
          title={pick(locale, "Today's Picks", "今日精选")}
          subtitle={pick(locale, "Start with three places worth opening first.", "先看今天最值得打开的三个目的地。")}
          locale={locale}
        />
        {todayPicks.length > 0 ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.9fr)_minmax(320px,1fr)]">
            {todayPicks[0] ? (
              <DestinationCard item={todayPicks[0]} locale={locale} homeCity={homeCity} imagePriority featured />
            ) : null}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
              {todayPicks.slice(1, 3).map((item, index) => (
                <DestinationCard key={item.id} item={item} locale={locale} homeCity={homeCity} imagePriority={index < 1} />
              ))}
            </div>
          </div>
        ) : (
          <EmptyState>{pick(locale, "No recommendations yet", "暂无推荐内容")}</EmptyState>
        )}
      </section>

      <section className="qmd-container qmd-section">
        <HomeSectionHeader
          title={pick(locale, "Family Stories", "本周家庭故事")}
          subtitle={pick(locale, "Fresh family reviews from real visitors.", "来自真实家庭的最新体验。")}
          href="/submit-spot"
          locale={locale}
        />
        <div className="scrollbar-none flex gap-5 overflow-x-auto pb-2">
          {latestReviews.length > 0 ? (
            latestReviews.slice(0, 3).map((review) => {
              const item = destinationsById.get(review.destinationId);
              if (!item) return null;

              return (
                <Link key={review.id} href={`/destinations/${item.id}#reviews`} className="qmd-place-card group flex min-h-[300px] w-[320px] shrink-0 flex-col p-5 md:w-[380px]">
                  <div className="flex items-start gap-3">
                    <ReviewAvatar review={review} locale={locale} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="font-bold text-slate-950">{review.userName || pick(locale, "Nickname not set", "未设置昵称")}</p>
                        <span className="text-xs text-slate-400">{formatShareTime(review.createdAt, locale)}</span>
                      </div>
                    </div>
                  </div>
                  <h3 className="mt-3 line-clamp-1 text-base font-black text-slate-950">{destinationName(item, locale)}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{shortText(review.content, 80)}</p>
                  <div className="mt-auto flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                    <span className="text-sm font-bold text-emerald-700 group-hover:text-emerald-800">
                      {pick(locale, "View review", "查看评价")}
                    </span>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="qmd-place-card w-[320px] shrink-0 p-5 text-sm text-slate-600 md:w-[380px]">
              {pick(locale, "No family stories yet", "还没有家庭故事")}
            </div>
          )}
        </div>
      </section>

      <section className="qmd-container qmd-section">
        <HomeSectionHeader
          title={pick(locale, "Today's Recommendation", "今天适合")}
          subtitle={pick(locale, "Based on published destinations and your saved preferences.", "根据已发布目的地和你的偏好推荐。")}
          href={`/weather?city=${encodeURIComponent(homeCity)}`}
          locale={locale}
        />
        {weatherDestinations.length > 0 ? (
          <div className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-4">
          <div className="scrollbar-none flex gap-5 overflow-x-auto pb-1">
          {weatherDestinations.slice(0, 3).map((item) => (
            <div key={item.id} className="w-[300px] shrink-0 md:w-[360px]">
              <DestinationCard item={item} locale={locale} homeCity={homeCity} />
            </div>
          ))}
          </div>
          </div>
        ) : (
          <EmptyState>{pick(locale, "No recommendations yet", "暂无推荐内容")}</EmptyState>
        )}
      </section>

      <section id="nearby" className="qmd-container qmd-section scroll-mt-20">
        <HomeSectionHeader
          title={pick(locale, "Nearby Recommendations", "📍 附近推荐")}
          subtitle={pick(locale, "Recommended from your current location when available.", "根据你的当前位置智能推荐")}
          href={destinationListHref({ city: homeCity, scenario: "all", difficulty: "all", maxDistance: 50, needParking: false, needToilet: false })}
          locale={locale}
        />
        {nearbyDestinations.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {nearbyDestinations.slice(0, 4).map((item) => (
              <DestinationCard key={item.id} item={item} locale={locale} homeCity={homeCity} metaLine={nearbyDistanceLine(item, locale)} />
            ))}
          </div>
        ) : (
          <EmptyState>{pick(locale, "No nearby recommendations yet", "暂无附近推荐")}</EmptyState>
        )}
      </section>

      <footer className="qmd-container mt-24 border-t border-slate-200 py-24 text-sm text-slate-500">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <p>{pick(locale, "Qimeide helps families find weekend outdoor places.", "栖美地帮亲子家庭发现周末户外目的地。")}</p>
          <p>{pick(locale, "Camping · Water play · Parks · Family trips", "露营 · 玩水 · 公园 · 亲子出游")}</p>
        </div>
      </footer>
    </main>
  );
}
