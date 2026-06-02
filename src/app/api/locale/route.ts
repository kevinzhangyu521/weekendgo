import { NextResponse } from "next/server";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE } from "@/lib/i18n/config";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { locale?: string };
  const nextLocale = body.locale && isLocale(body.locale) ? body.locale : DEFAULT_LOCALE;

  const response = NextResponse.json({ ok: true, locale: nextLocale });
  response.cookies.set(LOCALE_COOKIE, nextLocale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365
  });
  return response;
}
