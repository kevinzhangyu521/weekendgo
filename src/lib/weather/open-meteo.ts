import type { Locale } from "@/lib/i18n/config";

type CityCoordinate = {
  latitude: number;
  longitude: number;
};

type WeatherResult = {
  weather: string;
  wind: string;
  sourceUrl: string;
};

type GeocodingResult = {
  results?: Array<{
    latitude?: number;
    longitude?: number;
  }>;
};

type ForecastResult = {
  current?: {
    temperature_2m?: number;
    weather_code?: number;
    wind_speed_10m?: number;
  };
};

function pick<T>(locale: Locale, en: T, zh: T): T {
  return locale === "zh" ? zh : en;
}

const knownCityCoordinates: Record<string, CityCoordinate> = {
  "\u6b66\u6c49": { latitude: 30.5928, longitude: 114.3055 },
  Wuhan: { latitude: 30.5928, longitude: 114.3055 },
  "\u4e0a\u6d77": { latitude: 31.2304, longitude: 121.4737 },
  Shanghai: { latitude: 31.2304, longitude: 121.4737 },
  "\u5317\u4eac": { latitude: 39.9042, longitude: 116.4074 },
  Beijing: { latitude: 39.9042, longitude: 116.4074 },
  "\u676d\u5dde": { latitude: 30.2741, longitude: 120.1551 },
  Hangzhou: { latitude: 30.2741, longitude: 120.1551 },
  "\u6210\u90fd": { latitude: 30.5728, longitude: 104.0668 },
  Chengdu: { latitude: 30.5728, longitude: 104.0668 },
  "\u5e7f\u5dde": { latitude: 23.1291, longitude: 113.2644 },
  Guangzhou: { latitude: 23.1291, longitude: 113.2644 },
  "\u6df1\u5733": { latitude: 22.5431, longitude: 114.0579 },
  Shenzhen: { latitude: 22.5431, longitude: 114.0579 }
};

const weatherCodeLabels: Record<number, { en: string; zh: string }> = {
  0: { en: "Clear", zh: "\u6674" },
  1: { en: "Mainly clear", zh: "\u6674\u95f4\u591a\u4e91" },
  2: { en: "Partly cloudy", zh: "\u591a\u4e91\u95f4\u6674" },
  3: { en: "Cloudy", zh: "\u9634" },
  45: { en: "Fog", zh: "\u6709\u96fe" },
  48: { en: "Rime fog", zh: "\u96fe\u51c7" },
  51: { en: "Light drizzle", zh: "\u5c0f\u6bdb\u6bdb\u96e8" },
  53: { en: "Drizzle", zh: "\u6bdb\u6bdb\u96e8" },
  55: { en: "Heavy drizzle", zh: "\u8f83\u5f3a\u6bdb\u6bdb\u96e8" },
  61: { en: "Light rain", zh: "\u5c0f\u96e8" },
  63: { en: "Rain", zh: "\u4e2d\u96e8" },
  65: { en: "Heavy rain", zh: "\u5927\u96e8" },
  80: { en: "Rain showers", zh: "\u9635\u96e8" },
  81: { en: "Heavy showers", zh: "\u8f83\u5f3a\u9635\u96e8" },
  82: { en: "Violent showers", zh: "\u5f3a\u9635\u96e8" },
  95: { en: "Thunderstorm", zh: "\u96f7\u9635\u96e8" }
};

async function geocodeCity(city: string): Promise<CityCoordinate | null> {
  const known = knownCityCoordinates[city];
  if (known) return known;

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=zh&format=json`;
  const response = await fetch(url, { next: { revalidate: 86400 } });
  if (!response.ok) return null;

  const data = (await response.json()) as GeocodingResult;
  const first = data.results?.[0];
  if (typeof first?.latitude !== "number" || typeof first.longitude !== "number") return null;

  return {
    latitude: first.latitude,
    longitude: first.longitude
  };
}

function getWeatherLabel(weatherCode: number | undefined, locale: Locale) {
  const label = weatherCode !== undefined ? weatherCodeLabels[weatherCode] : null;
  return label ? pick(locale, label.en, label.zh) : pick(locale, "Weather updated", "\u5929\u6c14\u5df2\u66f4\u65b0");
}

function getWindLevel(windSpeedKmH: number | undefined) {
  if (typeof windSpeedKmH !== "number") return null;

  const thresholds = [1, 5, 11, 19, 28, 38, 49, 61, 74, 88, 102, 117];
  const level = thresholds.findIndex((threshold) => windSpeedKmH < threshold);
  return level === -1 ? 12 : level;
}

export async function getCityWeather(city: string, locale: Locale): Promise<WeatherResult | null> {
  try {
    const coordinate = await geocodeCity(city);
    if (!coordinate) return null;

    const params = new URLSearchParams({
      latitude: String(coordinate.latitude),
      longitude: String(coordinate.longitude),
      current: "temperature_2m,weather_code,wind_speed_10m",
      timezone: "auto"
    });

    const sourceUrl = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
    const response = await fetch(sourceUrl, {
      next: { revalidate: 3600 }
    });
    if (!response.ok) return null;

    const data = (await response.json()) as ForecastResult;
    const current = data.current;
    if (!current) return null;

    const temperature = typeof current.temperature_2m === "number" ? Math.round(current.temperature_2m) : null;
    const condition = getWeatherLabel(current.weather_code, locale);
    const windLevel = getWindLevel(current.wind_speed_10m);

    return {
      weather: temperature === null ? condition : pick(locale, `${condition} ${temperature}C`, `${condition} ${temperature}\u00b0C`),
      wind: windLevel === null ? pick(locale, "Wind updated", "\u98ce\u529b\u5df2\u66f4\u65b0") : pick(locale, `Wind level ${windLevel}`, `\u98ce\u529b ${windLevel}\u7ea7`),
      sourceUrl
    };
  } catch {
    return null;
  }
}
