import Link from "next/link";
import { Bath, Car, Footprints, Sandwich, ShieldCheck, Star, Tent, Waves } from "lucide-react";
import {
  destinationCity,
  destinationDescription,
  destinationDifficultyShort,
  destinationName,
  destinationSafety,
  destinationScenario
} from "@/features/destinations/presenter";
import { getAllDestinations } from "@/features/destinations/repository";
import type { DestinationItem, Scenario } from "@/features/destinations/types";
import { getMyProfile } from "@/features/profiles/repository";
import type { Locale } from "@/lib/i18n/config";
import { getLocale, pick } from "@/lib/i18n/server";
import { getCityWeather } from "@/lib/weather/open-meteo";

const scenes = [
  { key: "camping", label: "Camping", labelZh: "\u9732\u8425", icon: Tent, color: "bg-amber-100 text-amber-700" },
  { key: "creek", label: "Creek", labelZh: "\u6eaf\u6eaa", icon: Waves, color: "bg-sky-100 text-sky-700" },
  { key: "hiking", label: "Hiking", labelZh: "\u5f92\u6b65", icon: Footprints, color: "bg-orange-100 text-orange-700" },
  { key: "picnic", label: "Picnic", labelZh: "\u91ce\u9910", icon: Sandwich, color: "bg-pink-100 text-pink-700" }
] as const;

const fallbackImage = "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1400&q=80";

const defaultHomeCity = "\u6b66\u6c49";

const scenarioLabels: Record<Scenario, { en: string; zh: string }> = {
  camping: { en: "Camping", zh: "\u9732\u8425" },
  creek: { en: "Creek", zh: "\u6eaf\u6eaa" },
  hiking: { en: "Hiking", zh: "\u5f92\u6b65" },
  picnic: { en: "Picnic", zh: "\u91ce\u9910" }
};

type WeekendProfile = {
  text: string;
  textEn: string;
  temp: number;
  wind: number;
  advice: string;
  adviceEn: string;
  scenes: string;
  scenesEn: string;
  scenario: DestinationItem["scenario"];
};

const cityNames: Record<string, string> = {
  "\u6b66\u6c49": "Wuhan",
  "\u4e0a\u6d77": "Shanghai",
  "\u5317\u4eac": "Beijing",
  "\u676d\u5dde": "Hangzhou",
  "\u6210\u90fd": "Chengdu",
  "\u5e7f\u5dde": "Guangzhou",
  "\u6df1\u5733": "Shenzhen"
};

const weatherByCity: Record<string, WeekendProfile> = {
  "\u6b66\u6c49": {
    text: "\u591a\u4e91\u95f4\u6674",
    textEn: "Partly sunny",
    temp: 28,
    wind: 2,
    advice: "\u9002\u5408\u91ce\u9910\u548c\u8f7b\u5f92\u6b65",
    adviceEn: "Good for picnic and light hiking",
    scenes: "\u91ce\u9910 / \u5f92\u6b65",
    scenesEn: "Picnic / Hiking",
    scenario: "picnic"
  },
  "\u4e0a\u6d77": {
    text: "\u9634\u5230\u591a\u4e91",
    textEn: "Cloudy",
    temp: 26,
    wind: 3,
    advice: "\u9002\u5408\u516c\u56ed\u91ce\u9910\u548c\u77ed\u9014\u5f92\u6b65",
    adviceEn: "Good for parks and short walks",
    scenes: "\u91ce\u9910 / \u5f92\u6b65",
    scenesEn: "Picnic / Hiking",
    scenario: "picnic"
  },
  "\u676d\u5dde": {
    text: "\u6674\u5230\u591a\u4e91",
    textEn: "Sunny to cloudy",
    temp: 27,
    wind: 2,
    advice: "\u9002\u5408\u5f92\u6b65\u548c\u6eaf\u6eaa\u5468\u8fb9\u6e38",
    adviceEn: "Good for hiking and creek trips",
    scenes: "\u5f92\u6b65 / \u6eaf\u6eaa",
    scenesEn: "Hiking / Creek",
    scenario: "creek"
  }
};

function displayCity(city: string, locale: Locale) {
  return pick(locale, cityNames[city] ?? city, city);
}

function displayScenarios(scenarios: Scenario[], locale: Locale) {
  return scenarios.map((scenario) => pick(locale, scenarioLabels[scenario].en, scenarioLabels[scenario].zh)).join(" / ");
}

function getWeekendRange(locale: Locale) {
  const now = new Date();
  const day = now.getDay();
  const daysUntilSaturday = (6 - day + 7) % 7;
  const saturday = new Date(now);
  saturday.setDate(now.getDate() + daysUntilSaturday);
  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() + 1);

  const formatter = new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    month: "short",
    day: "numeric"
  });

  return `${formatter.format(saturday)} - ${formatter.format(sunday)}`;
}

function getWeekendRecommendation(city: string, preferredScenarios: Scenario[], locale: Locale) {
  const profile = weatherByCity[city] ?? weatherByCity[defaultHomeCity];
  const hasPreference = preferredScenarios.length > 0;
  const matchedScenario = hasPreference ? preferredScenarios[0] : profile.scenario;
  const matchedScenes = hasPreference ? displayScenarios(preferredScenarios, locale) : pick(locale, profile.scenesEn, profile.scenes);

  return {
    city: displayCity(city, locale),
    dateRange: getWeekendRange(locale),
    weather: pick(locale, `${profile.textEn} ${profile.temp}C`, `${profile.text} ${profile.temp}\u00b0C`),
    wind: pick(locale, `Wind level ${profile.wind}`, `\u98ce\u529b ${profile.wind}\u7ea7`),
    advice: hasPreference
      ? pick(locale, "Matched with your saved outdoor preferences", "\u5df2\u6839\u636e\u4f60\u5728\u8d44\u6599\u91cc\u9009\u62e9\u7684\u504f\u597d\u573a\u666f\u5339\u914d")
      : pick(locale, profile.adviceEn, profile.advice),
    source: hasPreference ? pick(locale, "Based on your profile preferences", "\u6839\u636e\u4f60\u7684\u8d44\u6599\u504f\u597d\u63a8\u8350") : pick(locale, "Based on city and weekend conditions", "\u6839\u636e\u57ce\u5e02\u548c\u672c\u5468\u672b\u60c5\u51b5\u63a8\u8350"),
    scenes: matchedScenes,
    href: `/destinations?scenario=${matchedScenario}&difficulty=all&maxDistance=120&needParking=false&needToilet=false`
  };
}

function formatDistance(distanceKm: number, locale: Locale) {
  if (!distanceKm || distanceKm <= 0) return pick(locale, "Distance pending", "\u8ddd\u79bb\u5f85\u8ba1\u7b97");
  return pick(locale, `${distanceKm}km away`, `\u8ddd\u79bb ${distanceKm}km`);
}

function SceneBadge({ item, locale }: { item: DestinationItem; locale: "en" | "zh" }) {
  const colorMap: Record<DestinationItem["scenario"], string> = {
    camping: "bg-amber-100 text-amber-700",
    creek: "bg-sky-100 text-sky-700",
    hiking: "bg-orange-100 text-orange-700",
    picnic: "bg-pink-100 text-pink-700"
  };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${colorMap[item.scenario]}`}>{destinationScenario(item, locale)}</span>;
}

function getPersonalizedDestinations(allDestinations: DestinationItem[], preferredScenarios: Scenario[]) {
  if (preferredScenarios.length === 0) return allDestinations.slice(0, 6);

  const matched = allDestinations.filter((item) => preferredScenarios.includes(item.scenario));
  const fallback = allDestinations.filter((item) => !preferredScenarios.includes(item.scenario));
  return [...matched, ...fallback].slice(0, 6);
}

export default async function HomePage() {
  const locale = await getLocale();
  const zh = locale === "zh";
  const profile = await getMyProfile();
  const homeCity = profile?.homeCity?.trim() || defaultHomeCity;
  const preferredScenarios = profile?.preferredScenarios ?? [];
  const dynamicWeather = await getCityWeather(homeCity, locale);
  const weatherSourceUrl = dynamicWeather?.sourceUrl;
  const weekend = {
    ...getWeekendRecommendation(homeCity, preferredScenarios, locale),
    ...(dynamicWeather ?? {})
  };
  const allDestinations = await getAllDestinations();
  const recommendations = getPersonalizedDestinations(allDestinations, preferredScenarios);

  return (
    <main className="min-h-screen">
      <section className="mx-auto mt-4 max-w-6xl px-4 md:px-6">
        <div
          className="relative overflow-hidden rounded-2xl bg-cover bg-center p-6 md:p-10"
          style={{
            backgroundImage:
              "linear-gradient(rgba(15,23,42,.45), rgba(15,23,42,.35)), url('https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1800&q=80')"
          }}
        >
          <p className="text-sm font-medium text-emerald-100">
            {pick(locale, "This Weekend", "\u672c\u5468\u672b\u63a8\u8350")} - {weekend.city} - {weekend.dateRange}
          </p>
          <h1 className="mt-2 max-w-xl text-2xl font-bold leading-tight text-white md:text-4xl">
            {pick(locale, `Family-friendly outdoor picks near ${weekend.city}`, `${weekend.city}\u5468\u8fb9\u4eb2\u5b50\u6237\u5916\u63a8\u8350`)}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-100 md:text-base">
            {pick(locale, `${weekend.source}: ${weekend.scenes}. ${weekend.advice}.`, `${weekend.source}\uff1a${weekend.scenes}\u3002${weekend.advice}\u3002`)}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700">{weekend.weather}</span>
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700">{weekend.wind}</span>
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700">{weekend.advice}</span>
          </div>
          {weatherSourceUrl ? (
            <a
              href={weatherSourceUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex text-xs font-medium text-emerald-100 underline-offset-4 hover:text-white hover:underline"
            >
              {pick(locale, "View live weather source", "\u67e5\u770b\u5b9e\u65f6\u5929\u6c14\u6570\u636e\u6e90")}
            </a>
          ) : null}
          <div className="mt-6 flex flex-col gap-3 rounded-xl bg-white/95 p-4 text-slate-800 shadow-sm backdrop-blur md:max-w-2xl md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{pick(locale, "Recommended plan", "\u63a8\u8350\u73a9\u6cd5")}</p>
              <p className="mt-1 text-base font-bold text-slate-900">{weekend.scenes}</p>
              <p className="mt-1 text-sm text-slate-600">{weekend.source}{pick(locale, ". Tap to see matched family-friendly destinations.", "\u3002\u70b9\u51fb\u67e5\u770b\u5339\u914d\u7684\u4eb2\u5b50\u6237\u5916\u76ee\u7684\u5730\u3002")}</p>
            </div>
            <Link
              href={weekend.href}
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md"
            >
              {pick(locale, "View weekend picks", "\u67e5\u770b\u672c\u5468\u672b\u63a8\u8350")}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-6 max-w-6xl px-4 md:px-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {scenes.map((item) => (
            <Link
              key={item.key}
              href={`/destinations?scenario=${item.key}`}
              className="group rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ${item.color}`}>
                <item.icon className="h-5 w-5" />
              </div>
              <p className="text-base font-semibold text-slate-900">{zh ? item.labelZh : item.label}</p>
              <p className="text-xs text-slate-500">{pick(locale, "Family popular", "\u4eb2\u5b50\u70ed\u95e8")}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-6xl px-4 pb-10 md:px-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">{pick(locale, "Recommended For You", "\u4e3a\u4f60\u63a8\u8350")}</h2>
          <Link href="/destinations" className="text-sm font-medium text-emerald-700 hover:text-emerald-800">
            {pick(locale, "View all", "\u67e5\u770b\u5168\u90e8")}
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recommendations.map((item) => (
            <Link
              key={item.id}
              href={`/destinations/${item.id}`}
              className="group block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl"
            >
              <div className="relative h-44 w-full overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center transition duration-300 group-hover:scale-105"
                  style={{ backgroundImage: `url('${item.image || fallbackImage}')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/35 to-transparent opacity-0 transition group-hover:opacity-100" />
                <span className="absolute bottom-3 right-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-emerald-700 opacity-0 shadow-sm transition group-hover:opacity-100">
                  {pick(locale, "View detail", "\u67e5\u770b\u8be6\u60c5")}
                </span>
              </div>
              <div className="space-y-3 p-4">
                <div className="flex items-center justify-between">
                  <SceneBadge item={item} locale={locale} />
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <Star className="h-3.5 w-3.5 fill-current text-amber-500" />
                    {item.rating.toFixed(1)}
                  </span>
                </div>

                <h3 className="line-clamp-1 text-base font-semibold text-slate-900 transition group-hover:text-emerald-700">{destinationName(item, locale)}</h3>
                <p className="line-clamp-2 text-sm text-slate-600">{destinationDescription(item, locale)}</p>

                <p className="text-sm text-slate-600">
                  {destinationCity(item, locale)} - {formatDistance(item.distanceKm, locale)} - {destinationDifficultyShort(item, locale)} - {destinationSafety(item, locale)}
                </p>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{item.minKidAge}{pick(locale, "+ years", "\u5c81+")}</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{item.hasParking ? pick(locale, "Parking", "\u53ef\u505c\u8f66") : pick(locale, "Limited parking", "\u505c\u8f66\u4e00\u822c")}</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{item.hasToilet ? pick(locale, "Toilet", "\u6709\u5395\u6240") : pick(locale, "Limited toilet", "\u5395\u6240\u8f83\u5c11")}</span>
                </div>

                <div className="flex items-center gap-4 border-t border-slate-100 pt-3 text-xs text-slate-600 transition group-hover:text-slate-700">
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {pick(locale, "Safety notes", "\u5b89\u5168\u63d0\u793a")}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Car className="h-3.5 w-3.5" />
                    {pick(locale, "Parking", "\u505c\u8f66")}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Bath className="h-3.5 w-3.5" />
                    {pick(locale, "Toilet", "\u6d17\u624b\u95f4")}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
