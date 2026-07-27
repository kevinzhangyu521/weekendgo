import Link from "next/link";
import { ArrowLeft, CloudSun, ExternalLink, Thermometer, Wind } from "lucide-react";
import { getLocale, pick } from "@/lib/i18n/server";
import { getCityWeather } from "@/lib/weather/open-meteo";

const defaultCity = "\u6b66\u6c49";

function formatUpdatedAt(value: string | null, locale: "en" | "zh") {
  if (!value) return pick(locale, "刚刚更新", "\u521a\u521a\u66f4\u65b0");
  return value.replace("T", " ");
}

export default async function WeatherPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getLocale();
  const params = await searchParams;
  const cityParam = params.city;
  const city = (Array.isArray(cityParam) ? cityParam[0] : cityParam)?.trim() || defaultCity;
  const weather = await getCityWeather(city, locale);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="qmd-container py-6">
        <Link href="/" className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-emerald-700">
          <ArrowLeft className="h-4 w-4" />
          {pick(locale, "返回首页", "\u8fd4\u56de\u9996\u9875")}
        </Link>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-emerald-700 px-5 py-6 text-white md:px-7">
            <p className="text-sm text-emerald-100">{pick(locale, "实时天气", "\u5b9e\u65f6\u5929\u6c14")}</p>
            <h1 className="mt-1 text-2xl font-bold">{city}</h1>
            <p className="mt-2 text-sm text-emerald-50">
              {weather ? pick(locale, "数据来自第三方实时天气服务，仅供出行参考。", "数据来自第三方实时天气服务，仅供出行参考。") : pick(locale, "暂时无法获取天气数据。", "\u6682\u65f6\u65e0\u6cd5\u83b7\u53d6\u5929\u6c14\u6570\u636e\u3002")}
            </p>
          </div>

          {weather ? (
            <div className="space-y-5 p-5 md:p-7">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl bg-emerald-50 p-4">
                  <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <CloudSun className="h-5 w-5" />
                  </div>
                  <p className="text-sm text-slate-500">{pick(locale, "天气", "\u5929\u6c14")}</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">{weather.condition}</p>
                </div>

                <div className="rounded-xl bg-orange-50 p-4">
                  <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100 text-orange-700">
                    <Thermometer className="h-5 w-5" />
                  </div>
                  <p className="text-sm text-slate-500">{pick(locale, "气温", "\u6c14\u6e29")}</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {weather.temperature === null ? pick(locale, "暂无", "\u6682\u65e0") : `${weather.temperature}\u00b0C`}
                  </p>
                </div>

                <div className="rounded-xl bg-sky-50 p-4">
                  <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                    <Wind className="h-5 w-5" />
                  </div>
                  <p className="text-sm text-slate-500">{pick(locale, "风力", "\u98ce\u529b")}</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {weather.windLevel === null ? weather.wind : pick(locale, `${weather.windLevel}级`, `${weather.windLevel}\u7ea7`)}
                  </p>
                  {weather.windSpeedKmH === null ? null : <p className="mt-1 text-xs text-slate-500">{weather.windSpeedKmH.toFixed(1)} km/h</p>}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">{pick(locale, "对亲子出行的含义", "\u5bf9\u4eb2\u5b50\u51fa\u884c\u7684\u542b\u4e49")}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {pick(
                    locale,
                    "Use this as a quick pre-trip reference. Before creek, hiking, or camping plans, please check rain and local safety notices again.",
                    "\u8fd9\u4e2a\u5929\u6c14\u4ec5\u4f5c\u4e3a\u51fa\u53d1\u524d\u5feb\u901f\u53c2\u8003\u3002\u5982\u679c\u8981\u6eaf\u6eaa\u3001\u5f92\u6b65\u6216\u9732\u8425\uff0c\u51fa\u53d1\u524d\u8bf7\u518d\u6b21\u786e\u8ba4\u964d\u96e8\u548c\u5f53\u5730\u5b89\u5168\u63d0\u793a\u3002"
                  )}
                </p>
              </div>

              <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
                <span>{pick(locale, "更新时间", "\u66f4\u65b0\u65f6\u95f4")}: {formatUpdatedAt(weather.updatedAt, locale)}</span>
                <a href="https://open-meteo.com/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-emerald-700 hover:text-emerald-800">
                  {pick(locale, "数据来源说明", "\u6570\u636e\u6765\u6e90\u8bf4\u660e")}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          ) : (
            <div className="p-5 md:p-7">
              <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                {pick(locale, "当前天气暂时不可用，请稍后再试。", "\u5f53\u524d\u5929\u6c14\u6682\u65f6\u4e0d\u53ef\u7528\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002")}
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
