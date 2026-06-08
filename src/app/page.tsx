import Link from "next/link";
import {
  Bath,
  Car,
  ChevronRight,
  CloudSun,
  Footprints,
  Navigation,
  Search,
  Sandwich,
  ShieldCheck,
  Tent,
  Users,
  Waves
} from "lucide-react";
import { Top10Carousel } from "@/components/home/top10-carousel";
import { getDestinationImage } from "@/features/destinations/images";
import {
  destinationDescription,
  destinationDifficultyShort,
  destinationFamilyHighlight,
  destinationName,
  destinationRegion,
  destinationSafety,
  destinationScenario
} from "@/features/destinations/presenter";
import { getAllDestinations } from "@/features/destinations/repository";
import type { DestinationItem, Scenario } from "@/features/destinations/types";
import { getMyProfile } from "@/features/profiles/repository";
import { DEFAULT_HOME_CITY, withDistanceFromCity } from "@/lib/geo/distance";
import type { Locale } from "@/lib/i18n/config";
import { getLocale, pick } from "@/lib/i18n/server";

const scenes = [
  { key: "camping", label: "Camping", labelZh: "露营", icon: Tent, color: "bg-amber-100 text-amber-700" },
  { key: "creek", label: "Creek", labelZh: "溯溪", icon: Waves, color: "bg-sky-100 text-sky-700" },
  { key: "hiking", label: "Hiking", labelZh: "徒步", icon: Footprints, color: "bg-orange-100 text-orange-700" },
  { key: "picnic", label: "Picnic", labelZh: "野餐", icon: Sandwich, color: "bg-pink-100 text-pink-700" }
] as const;

const cityOptions = ["武汉", "上海", "杭州", "成都"] as const;

const cityNames: Record<string, string> = {
  武汉: "Wuhan",
  上海: "Shanghai",
  北京: "Beijing",
  杭州: "Hangzhou",
  成都: "Chengdu",
  广州: "Guangzhou",
  深圳: "Shenzhen"
};

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
    advice: "适合徒步和溯溪周边游",
    adviceEn: "Good for hiking and creek trips",
    scenario: "creek"
  }
};

function displayCity(city: string, locale: Locale) {
  return pick(locale, cityNames[city] ?? city, city);
}

function getWeekendWeather(city: string, preferredScenarios: Scenario[], locale: Locale) {
  const profile = weatherByCity[city] ?? weatherByCity[DEFAULT_HOME_CITY];
  const scenario = preferredScenarios[0] ?? profile.scenario;

  return {
    scenario,
    weather: pick(locale, `${profile.textEn} ${profile.temp}C`, `${profile.text} ${profile.temp}°C`),
    wind: pick(locale, `Wind level ${profile.wind}`, `风力 ${profile.wind}级`),
    advice: preferredScenarios.length > 0
      ? pick(locale, "Matched with your saved preferences", "已根据你的偏好场景匹配")
      : pick(locale, profile.adviceEn, profile.advice)
  };
}

function formatDistance(distanceKm: number, locale: Locale) {
  if (!distanceKm || distanceKm <= 0) return pick(locale, "Distance pending", "距离待计算");
  return pick(locale, `${distanceKm}km`, `${distanceKm}km`);
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

function getTopDestinations(items: DestinationItem[], homeCity: string) {
  const nearby = items.filter((item) => isNearHomeCity(item, homeCity));
  const source = nearby.length > 0 ? nearby : items;
  return [...source].sort((a, b) => worthScore(b) - worthScore(a)).slice(0, 10);
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

function SectionHeader({ title, subtitle, href, locale }: { title: string; subtitle?: string; href?: string; locale: Locale }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-bold text-slate-950">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p> : null}
      </div>
      {href ? (
        <Link href={href} className="inline-flex shrink-0 items-center text-xs font-semibold text-emerald-700">
          {pick(locale, "More", "更多")}
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      ) : null}
    </div>
  );
}

function CompactDestinationCard({ item, locale, reason }: { item: DestinationItem; locale: Locale; reason: string }) {
  const image = getDestinationImage(item);

  return (
    <Link href={`/destinations/${item.id}`} className="grid grid-cols-[96px_1fr] gap-3 rounded-2xl bg-white p-2 shadow-sm ring-1 ring-slate-100 transition hover:shadow-md">
      <div className="relative h-24 overflow-hidden rounded-xl bg-slate-100">
        <img src={image.src} alt={destinationName(item, locale)} loading="lazy" decoding="async" className="h-full w-full object-cover" />
        {image.pending ? <span className="absolute left-1.5 top-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">待补充</span> : null}
      </div>
      <div className="min-w-0 py-1">
        <p className="text-[11px] font-semibold text-emerald-700">{reason}</p>
        <h3 className="mt-1 line-clamp-1 text-sm font-bold text-slate-950">{destinationName(item, locale)}</h3>
        <p className="mt-1 line-clamp-1 text-xs text-slate-500">{destinationFamilyHighlight(item, locale)}</p>
        <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-slate-600">
          <span className="rounded-full bg-slate-100 px-2 py-1">{formatDistance(item.distanceKm, locale)}</span>
          <span className="rounded-full bg-slate-100 px-2 py-1">{destinationDifficultyShort(item, locale)}</span>
          <span className="rounded-full bg-slate-100 px-2 py-1">{destinationSafety(item, locale)}</span>
        </div>
      </div>
    </Link>
  );
}

export default async function HomePage() {
  const [locale, profile, rawDestinations] = await Promise.all([getLocale(), getMyProfile(), getAllDestinations()]);
  const zh = locale === "zh";
  const homeCity = profile?.homeCity?.trim() || DEFAULT_HOME_CITY;
  const preferredScenarios = profile?.preferredScenarios ?? [];
  const city = displayCity(homeCity, locale);
  const weekendWeather = getWeekendWeather(homeCity, preferredScenarios, locale);
  const allDestinations = withDistanceFromCity(rawDestinations, homeCity);
  const topDestinations = getTopDestinations(allDestinations, homeCity);
  const topRankings = {
    overall: topDestinations,
    creek: getScenarioTopDestinations(allDestinations, homeCity, "creek"),
    camping: getScenarioTopDestinations(allDestinations, homeCity, "camping"),
    youngKids: getYoungKidTopDestinations(allDestinations, homeCity)
  };
  const weatherDestinations = allDestinations
    .filter((item) => item.scenario === weekendWeather.scenario)
    .sort((a, b) => worthScore(b) - worthScore(a))
    .slice(0, 4);
  const nearbyDestinations = [...allDestinations].sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 4);
  const latestShares = [...allDestinations].slice(0, 6);

  return (
    <main className="min-h-screen bg-slate-50 pb-10">
      <section className="bg-white px-4 pb-3 pt-3 shadow-sm">
        <div className="mx-auto max-w-6xl">
          <div>
            <h1 className="mt-0.5 text-2xl font-black leading-tight text-slate-950 md:text-3xl">
              {pick(locale, `Where to take kids near ${city}`, `${homeCity}本周去哪遛娃`)}
            </h1>
            <Link href={`/weather?city=${encodeURIComponent(homeCity)}`} className="mt-1 inline-flex text-sm font-medium text-slate-600 hover:text-emerald-700">
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
            <button type="submit" className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-bold text-white">
              {pick(locale, "Search", "搜索")}
            </button>
          </form>

          <div className="mt-3 flex flex-wrap gap-2">
            {scenes.map((item) => (
              <Link
                key={item.key}
                href={destinationListHref({ scenario: item.key, difficulty: "all", maxDistance: 120, needParking: false, needToilet: false })}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition hover:shadow-sm ${item.color}`}
              >
                <item.icon className="h-3.5 w-3.5" />
                {zh ? item.labelZh : item.label}
              </Link>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <Link href="#top10" className="rounded-2xl bg-rose-50 px-3 py-2 text-center text-xs font-black text-rose-700">
              🔥 {pick(locale, "Top 10", "本周TOP10")}
            </Link>
            <Link href="#nearby" className="rounded-2xl bg-emerald-50 px-3 py-2 text-center text-xs font-black text-emerald-700">
              📍 {pick(locale, "Nearest", "离我最近")}
            </Link>
            <Link href={destinationListHref({ city: homeCity, scenario: "all", difficulty: "easy", maxDistance: 80, needParking: true, needToilet: true })} className="rounded-2xl bg-sky-50 px-3 py-2 text-center text-xs font-black text-sky-700">
              👶 {pick(locale, "Young kids", "低龄宝宝")}
            </Link>
          </div>
        </div>
      </section>

      <Top10Carousel locale={locale} homeCity={homeCity} rankings={topRankings} />

      <section className="mx-auto mt-6 max-w-6xl px-4">
        <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 p-4 text-white shadow-sm">
          <div className="flex items-start gap-3">
            <span className="rounded-2xl bg-white/15 p-2">
              <CloudSun className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-emerald-50">{pick(locale, "Weather-based picks", "根据天气推荐")}</p>
              <h2 className="mt-1 text-lg font-black">{weekendWeather.weather} · {weekendWeather.advice}</h2>
              <p className="mt-1 text-xs text-emerald-50">{weekendWeather.wind} · {pick(locale, "Tap to view weather details", "可点击查看天气详情")}</p>
            </div>
            <Link href={`/weather?city=${encodeURIComponent(homeCity)}`} className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-emerald-700">
              {pick(locale, "Details", "详情")}
            </Link>
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {weatherDestinations.slice(0, 2).map((item) => (
              <Link key={item.id} href={`/destinations/${item.id}`} className="rounded-2xl bg-white/95 p-3 text-slate-900">
                <p className="text-xs font-semibold text-emerald-700">{destinationScenario(item, locale)}</p>
                <h3 className="mt-1 line-clamp-1 font-bold">{destinationName(item, locale)}</h3>
                <p className="mt-1 line-clamp-1 text-xs text-slate-500">{destinationFamilyHighlight(item, locale)}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="nearby" className="mx-auto mt-6 max-w-6xl scroll-mt-20 px-4">
        <SectionHeader
          title={pick(locale, "Near me", "离我最近去哪")}
          subtitle={pick(locale, `Calculated from ${city}`, `按常住城市「${homeCity}」计算距离`)}
          href={destinationListHref({ city: homeCity, scenario: "all", difficulty: "all", maxDistance: 50, needParking: false, needToilet: false })}
          locale={locale}
        />
        <div className="grid gap-3 md:grid-cols-2">
          {nearbyDestinations.map((item) => (
            <CompactDestinationCard key={item.id} item={item} locale={locale} reason={pick(locale, "Closest option", "附近推荐")} />
          ))}
        </div>
      </section>

      <section className="mx-auto mt-6 max-w-6xl px-4">
        <SectionHeader
          title={pick(locale, "Latest family shares", "最新用户分享")}
          subtitle={pick(locale, "Fresh places families are checking", "最近被家庭关注的地点")}
          href="/submit-spot"
          locale={locale}
        />
        <div className="grid gap-3 md:grid-cols-2">
          {latestShares.slice(0, 4).map((item) => (
            <Link key={item.id} href={`/destinations/${item.id}`} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 transition hover:shadow-md">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-emerald-700">
                    <Users className="mr-1 inline h-3.5 w-3.5" />
                    {pick(locale, "User shared", "用户分享")}
                  </p>
                  <h3 className="mt-1 line-clamp-1 font-bold text-slate-950">{destinationName(item, locale)}</h3>
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{destinationScenario(item, locale)}</span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-slate-600">{destinationDescription(item, locale)}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                  <Navigation className="h-3.5 w-3.5" />
                  {formatDistance(item.distanceKm, locale)}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                  <Car className="h-3.5 w-3.5" />
                  {item.hasParking ? "可停车" : "停车一般"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                  <Bath className="h-3.5 w-3.5" />
                  {item.hasToilet ? "有厕所" : "厕所较少"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {destinationSafety(item, locale)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
