"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import type { WeatherResult } from "@/lib/weather/open-meteo";

type Props = {
  city: string;
  locale: Locale;
  fallbackWeather: string;
  fallbackWind: string;
  advice: string;
  detailHref: string;
};

function pick(locale: Locale, en: string, zh: string) {
  return locale === "zh" ? zh : en;
}

export function HomeWeatherBadges({ city, locale, fallbackWeather, fallbackWind, advice, detailHref }: Props) {
  const [weather, setWeather] = useState<WeatherResult | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadWeather() {
      try {
        const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}&locale=${locale}`);
        if (!response.ok) return;
        const data = (await response.json()) as { weather?: WeatherResult | null };
        if (active && data.weather) setWeather(data.weather);
      } finally {
        if (active) setLoaded(true);
      }
    }

    loadWeather();

    return () => {
      active = false;
    };
  }, [city, locale]);

  return (
    <>
      <div className="mt-5 flex flex-wrap gap-2">
        <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700">
          {weather?.weather ?? fallbackWeather}
        </span>
        <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700">
          {weather?.wind ?? fallbackWind}
        </span>
        <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700">{advice}</span>
        <span className="rounded-full bg-emerald-100/95 px-3 py-1 text-xs font-semibold text-emerald-800">
          {loaded && weather ? pick(locale, "实时天气", "\u5b9e\u65f6\u5929\u6c14") : pick(locale, "天气更新中", "\u5929\u6c14\u66f4\u65b0\u4e2d")}
        </span>
      </div>
      <Link
        href={detailHref}
        className="mt-3 inline-flex text-xs font-medium text-emerald-100 underline-offset-4 hover:text-white hover:underline"
      >
        {pick(locale, "查看天气详情", "\u67e5\u770b\u5929\u6c14\u8be6\u60c5")}
      </Link>
    </>
  );
}
