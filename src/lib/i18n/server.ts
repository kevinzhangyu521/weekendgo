import { cookies } from "next/headers";
import { DEFAULT_LOCALE, isLocale, type Locale, LOCALE_COOKIE } from "./config";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(LOCALE_COOKIE)?.value;
  if (raw && isLocale(raw)) return raw;
  return DEFAULT_LOCALE;
}

export function pick<T>(locale: Locale, en: T, zh: T): T {
  return zh;
}
