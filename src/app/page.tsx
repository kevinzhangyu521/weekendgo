import Link from "next/link";
import {
  Footprints,
  Search,
  Sandwich,
  Tent,
  Waves
} from "lucide-react";
import { HomeDestinationCard, HomeSectionHeader, Top10Carousel } from "@/components/home/top10-carousel";
import { hasUsableDestinationImage } from "@/features/destinations/images";
import { getDestinationStats } from "@/features/destinations/stats";
import {
  destinationName,
  destinationScenario
} from "@/features/destinations/presenter";
import { getAllDestinations } from "@/features/destinations/repository";
import type { DestinationItem, Scenario } from "@/features/destinations/types";
import { getMyProfile } from "@/features/profiles/repository";
import { getLatestDestinationReviews, getReviewCountsForDestinations } from "@/features/reviews/repository";
import type { DestinationReview } from "@/features/reviews/types";
import { DEFAULT_HOME_CITY, withDistanceFromCity } from "@/lib/geo/distance";
import type { Locale } from "@/lib/i18n/config";
import { getLocale, pick } from "@/lib/i18n/server";

const scenes = [
  { key: "camping", label: "Camping", labelZh: "露营", icon: Tent, color: "bg-amber-100 text-amber-700" },
  { key: "creek", label: "Creek", labelZh: "溯溪", icon: Waves, color: "bg-sky-100 text-sky-700" },
  { key: "hiking", label: "Hiking", labelZh: "徒步", icon: Footprints, color: "bg-orange-100 text-orange-700" },
  { key: "picnic", label: "Picnic", labelZh: "野餐", icon: Sandwich, color: "bg-pink-100 text-pink-700" }
] as const;

const cityNames: Record<string, string> = {
  武汉: "Wuhan",
  上海: "Shanghai",
  北京: "Beijing",
  杭州: "Hangzhou",
  成都: "Chengdu",
  广州: "Guangzhou",
  深圳: "Shenzhen"
};

const knownCityNames = [
  "武汉",
  "黄冈",
  "咸宁",
  "鄂州",
  "孝感",
  "仙桃",
  "潜江",
  "天门",
  "宜昌",
  "荆州",
  "上海",
  "杭州",
  "成都",
  "北京",
  "广州",
  "深圳"
];

function cityOptionName(item: DestinationItem) {
  const raw = [item.cityZh, item.city].find((value) => value?.trim())?.trim() ?? "";
  const matched = knownCityNames.find((city) => raw.includes(city));
  return matched ?? raw;
}

function getHomeCityOptions(items: DestinationItem[], homeCity: string) {
  const options = new Set<string>([DEFAULT_HOME_CITY, homeCity]);

  items.forEach((item) => {
    const city = cityOptionName(item);
    if (city) options.add(city);
  });

  return Array.from(options).sort((a, b) => {
    if (a === DEFAULT_HOME_CITY) return -1;
    if (b === DEFAULT_HOME_CITY) return 1;
    return a.localeCompare(b, "zh-CN");
  });
}

type WeekendProfile = {
  text: string;
  textEn: string;
  temp: number;
  wind: number;
  advice: string;
  adviceEn: string;
  scenario: Scenario;
};

const weatherByCity: Record<string, WeekendProfile> = {
  武汉: {
    text: "多云间晴",
    textEn: "Partly sunny",
    temp: 28,
    wind: 2,
    advice: "适合野餐和轻徒步",
    adviceEn: "Good for picnic and light hiking",
    scenario: "picnic"
  },
  上海: {
    text: "阴到多云",
    textEn: "Cloudy",
    temp: 26,
    wind: 3,
    advice: "适合公园野餐和短途徒步",
    adviceEn: "Good for parks and short walks",
    scenario: "picnic"
  },
  杭州: {
    text: "晴到多云",
    textEn: "Sunny to cloudy",
    temp: 27,
    wind: 2,
    advice: "适合徒步和溪流周边游",
    adviceEn: "Good for hiking and creek trips",
    scenario: "creek"
  }
};

function displayCity(city: string, locale: Locale) {
  return pick(locale, cityNames[city] ?? city, city);
}

function getWeekendWeather(city: string, preferredScenarios: Scenario[], locale: Locale) {
  const profile = weatherByCity[city] ?? weatherByCity[DEFAULT_HOME_CITY] ?? weatherByCity.武汉;
  const scenario = preferredScenarios[0] ?? profile.scenario;

  return {
    scenario,
    weather: pick(locale, `${profile.textEn} ${profile.temp}C`, `${profile.text} ${profile.temp}°C`),
    wind: pick(locale, `Wind level ${profile.wind}`, `风力 ${profile.wind}级`),
    advice:
      preferredScenarios.length > 0
        ? pick(locale, "Matched with your saved preferences", "已根据你的偏好场景匹配")
        : pick(locale, profile.adviceEn, profile.advice)
  };
}

function shortText(text: string, maxLength = 80) {
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}...` : normalized;
}

function shareTag(item: DestinationItem, locale: Locale) {
  const labels: Record<Scenario, { en: string; zh: string }> = {
    camping: { en: "Camping experience", zh: "露营体验" },
    creek: { en: "Creek guide", zh: "溯溪攻略" },
    hiking: { en: "Family-tested trail", zh: "亲子实测" },
    picnic: { en: "Mom's pick", zh: "宝妈分享" }
  };
  return pick(locale, labels[item.scenario].en, labels[item.scenario].zh);
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

function getScenarioTopDestinations(items: DestinationItem[], homeCity: string, scenario: Scenario) {
  const scenarioItems = items.filter((item) => item.scenario === scenario);
  return scenarioItems.length > 0 ? getTopDestinations(scenarioItems, homeCity) : getTopDestinations(items, homeCity);
}

function getYoungKidTopDestinations(items: DestinationItem[], homeCity: string) {
  const nearby = items.filter((item) => isNearHomeCity(item, homeCity));
  const source = nearby.length > 0 ? nearby : items;
  return [...source]
    .sort((a, b) => {
      const ageGap = a.minKidAge - b.minKidAge;
      if (ageGap !== 0) return ageGap;
      return worthScore(b) - worthScore(a);
    })
    .slice(0, 10);
}

function destinationListHref(params: Record<string, string | number | boolean>) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => searchParams.set(key, String(value)));
  return `/destinations?${searchParams.toString()}`;
}

export default async function HomePage() {
  const [locale, profile, rawDestinations] = await Promise.all([getLocale(), getMyProfile(), getAllDestinations()]);
  const zh = locale === "zh";
  const homeCity = profile?.homeCity?.trim() || DEFAULT_HOME_CITY;
  const cityOptions = getHomeCityOptions(rawDestinations, homeCity);
  const preferredScenarios = profile?.preferredScenarios ?? [];
  const city = displayCity(homeCity, locale);
  const weekendWeather = getWeekendWeather(homeCity, preferredScenarios, locale);
  const allDestinations = withDistanceFromCity(rawDestinations, homeCity).filter(hasUsableDestinationImage);
  const destinationIds = allDestinations.map((item) => item.id);
  const [reviewCounts, destinationStats] = await Promise.all([
    getReviewCountsForDestinations(destinationIds),
    getDestinationStats(destinationIds)
  ]);
  const destinationsWithReviews = allDestinations.map((item) => ({
    ...item,
    reviewCount: reviewCounts.get(item.id) ?? 0,
    favoriteCount: destinationStats.get(item.id)?.favoriteCount ?? 0,
    viewCount: destinationStats.get(item.id)?.viewCount ?? 0,
    shareCount: destinationStats.get(item.id)?.shareCount ?? 0
  }));
  const topDestinations = getTopDestinations(destinationsWithReviews, homeCity);
  const topRankings = {
    overall: topDestinations,
    creek: getScenarioTopDestinations(destinationsWithReviews, homeCity, "creek"),
    camping: getScenarioTopDestinations(destinationsWithReviews, homeCity, "camping"),
    youngKids: getYoungKidTopDestinations(destinationsWithReviews, homeCity)
  };
  const weatherDestinations = destinationsWithReviews
    .filter((item) => item.scenario === weekendWeather.scenario)
    .sort((a, b) => worthScore(b) - worthScore(a))
    .slice(0, 4);
  const nearbyDestinations = [...destinationsWithReviews].sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 4);
  const latestReviews = await getLatestDestinationReviews(destinationIds, 4);
  const destinationsById = new Map(destinationsWithReviews.map((item) => [item.id, item]));

  return (
    <main className="min-h-screen bg-slate-50 pb-10">
      <section className="bg-white pb-3 pt-3 shadow-sm">
        <div className="qmd-container">
          <div>
            <h1 className="mt-0.5 text-2xl font-black leading-tight text-slate-950 md:text-3xl">
              {pick(locale, `Where to take kids near ${city}`, `${homeCity}本周去哪遛娃`)}
            </h1>
            <Link href={`/weather?city=${encodeURIComponent(homeCity)}`} className="interactive-text-link mt-1 inline-flex text-sm font-medium text-slate-600">
              {pick(locale, `Live weather: ${weekendWeather.weather} · Play: ${weekendWeather.advice}`, `实时天气：${weekendWeather.weather} · 推荐玩法：${weekendWeather.advice}`)}
            </Link>
          </div>

          <form action="/destinations" className="mt-3 grid gap-2 md:grid-cols-[1fr_160px_auto]">
            <div className="flex min-w-0 items-center gap-2 rounded-full bg-slate-100 px-3 py-2.5">
              <Search className="h-4 w-4 shrink-0 text-slate-400" />
              <input name="q" type="search" placeholder={pick(locale, "Search East Lake, creek, camping...", "搜索东湖、溯溪、露营地...")} className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400" />
            </div>
            <select name="city" defaultValue={homeCity} className="rounded-full bg-slate-100 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none ring-0">
              {cityOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <button type="submit" className="interactive-button rounded-full bg-slate-950 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800">
              {pick(locale, "Search", "搜索")}
            </button>
          </form>

          <div className="mt-3 flex flex-wrap gap-2">
            {scenes.map((item) => (
              <Link
                key={item.key}
                href={destinationListHref({ scenario: item.key, difficulty: "all", maxDistance: 120, needParking: false, needToilet: false })}
                className={`interactive-button inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold hover:shadow-sm ${item.color}`}
              >
                <item.icon className="h-3.5 w-3.5" />
                {zh ? item.labelZh : item.label}
              </Link>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <Link href="#top10" className="interactive-button rounded-2xl bg-rose-50 px-3 py-2 text-center text-xs font-black text-rose-700">
              {pick(locale, "Top 10", "本周TOP10")}
            </Link>
            <Link href="#nearby" className="interactive-button rounded-2xl bg-emerald-50 px-3 py-2 text-center text-xs font-black text-emerald-700">
              {pick(locale, "Nearest", "离我最近")}
            </Link>
            <Link href={destinationListHref({ city: homeCity, scenario: "all", difficulty: "easy", maxDistance: 80, needParking: true, needToilet: true })} className="interactive-button rounded-2xl bg-sky-50 px-3 py-2 text-center text-xs font-black text-sky-700">
              {pick(locale, "Young kids", "低龄宝宝")}
            </Link>
          </div>
        </div>
      </section>

      <Top10Carousel locale={locale} homeCity={homeCity} rankings={topRankings} isSignedIn={Boolean(profile)} />

      <section className="qmd-container qmd-section">
        <HomeSectionHeader
          title={pick(locale, "Weather picks", "根据天气推荐")}
          subtitle={pick(locale, `${weekendWeather.weather}. ${weekendWeather.advice}.`, `今天${homeCity}${weekendWeather.weather}，${weekendWeather.advice}。`)}
          href={`/weather?city=${encodeURIComponent(homeCity)}`}
          locale={locale}
        />
        <div className="qmd-grid-3">
          {weatherDestinations.slice(0, 3).map((item) => (
            <HomeDestinationCard key={item.id} item={item} locale={locale} homeCity={homeCity} isSignedIn={Boolean(profile)} badgeLabel={pick(locale, "Weather pick", "天气推荐")} />
          ))}
        </div>
      </section>

      <section id="nearby" className="qmd-container qmd-section scroll-mt-20">
        <HomeSectionHeader
          title={pick(locale, "Near me", "离我最近去哪")}
          subtitle={pick(locale, `Calculated from ${city}`, `按常住城市「${homeCity}」计算距离`)}
          href={destinationListHref({ city: homeCity, scenario: "all", difficulty: "all", maxDistance: 50, needParking: false, needToilet: false })}
          locale={locale}
        />
        <div className="qmd-grid-3">
          {nearbyDestinations.slice(0, 3).map((item) => (
            <HomeDestinationCard key={item.id} item={item} locale={locale} homeCity={homeCity} isSignedIn={Boolean(profile)} badgeLabel={pick(locale, "Nearby pick", "附近推荐")} />
          ))}
        </div>
      </section>

      <section className="qmd-container qmd-section">
        <HomeSectionHeader
          title={pick(locale, "Family stories", "最新亲子分享")}
          subtitle={pick(locale, "Fresh family reviews from real visitors", "来自真实家庭的最新体验")}
          href="/submit-spot"
          locale={locale}
        />
        <div className="qmd-grid-3">
          {latestReviews.length > 0 ? (
            latestReviews.slice(0, 3).map((review) => {
              const item = destinationsById.get(review.destinationId);
              if (!item) return null;

              return (
                <Link key={review.id} href={`/destinations/${item.id}#reviews`} className="qmd-place-card group flex min-h-[360px] flex-col p-5">
                  <div className="flex items-start gap-3">
                    <ReviewAvatar review={review} locale={locale} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="font-bold text-slate-950">{review.userName || pick(locale, "Nickname not set", "未设置昵称")}</p>
                        <span className="text-xs text-slate-400">{formatShareTime(review.createdAt, locale)}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{shareTag(item, locale)}</span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{destinationScenario(item, locale)}</span>
                      </div>
                    </div>
                  </div>
                  <h3 className="mt-3 line-clamp-1 text-base font-black text-slate-950">{destinationName(item, locale)}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{shortText(review.content, 80)}</p>
                  <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                      ⭐ {review.rating.toFixed(1)}
                    </span>
                    <span className="text-sm font-bold text-emerald-700 group-hover:text-emerald-800">
                      {pick(locale, "View review", "查看评价")}
                    </span>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="qmd-place-card p-5 text-sm text-slate-600 md:col-span-2 lg:col-span-3">
              {pick(locale, "No family stories yet. Reviews submitted by users will appear here.", "暂无真实亲子分享。用户提交评价后，会显示在这里。")}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
