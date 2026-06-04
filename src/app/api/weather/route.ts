import { NextResponse } from "next/server";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getCityWeather } from "@/lib/weather/open-meteo";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city")?.trim();
  const rawLocale = searchParams.get("locale") ?? "zh";
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "zh";

  if (!city) {
    return NextResponse.json({ error: "city_required" }, { status: 400 });
  }

  const weather = await getCityWeather(city, locale);

  return NextResponse.json(
    { weather },
    {
      headers: {
        "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800"
      }
    }
  );
}
