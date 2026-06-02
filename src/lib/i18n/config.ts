export type Locale = "en" | "zh";

export const DEFAULT_LOCALE: Locale = "zh";
export const LOCALE_COOKIE = "weekendgo_locale";

export function isLocale(value: string): value is Locale {
  return value === "en" || value === "zh";
}
