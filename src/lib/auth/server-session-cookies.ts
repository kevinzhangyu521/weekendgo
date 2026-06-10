import type { NextResponse } from "next/server";

export const QIMEIDE_ACCESS_COOKIE = "qimeide_access_token";
export const QIMEIDE_REFRESH_COOKIE = "qimeide_refresh_token";
export const QIMEIDE_EMAIL_COOKIE = "qimeide_auth_email";
export const QIMEIDE_COOKIE_TEST = "qimeide_cookie_test";
export const QIMEIDE_LOGIN_DEBUG_COOKIE = "qimeide_login_debug";

const SESSION_MAX_AGE = 400 * 24 * 60 * 60;

type CookieOptions = Parameters<NextResponse["cookies"]["set"]>[2];

export function getQimeideCookieDomain() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "";
  if (siteUrl.includes("qimeide.com")) return ".qimeide.com";
  if (process.env.NODE_ENV === "production") return ".qimeide.com";
  return undefined;
}

function withSharedDomain(options: CookieOptions): CookieOptions {
  const domain = getQimeideCookieDomain();
  return domain ? { ...options, domain } : options;
}

const sessionCookieOptions: CookieOptions = {
  path: "/",
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  httpOnly: true,
  maxAge: SESSION_MAX_AGE
};

const emailCookieOptions: CookieOptions = {
  path: "/",
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: SESSION_MAX_AGE
};

export function setQimeideSessionCookies(response: NextResponse, session: { access_token: string; refresh_token: string }, email: string) {
  response.cookies.set(QIMEIDE_ACCESS_COOKIE, session.access_token, withSharedDomain(sessionCookieOptions));
  response.cookies.set(QIMEIDE_REFRESH_COOKIE, session.refresh_token, withSharedDomain(sessionCookieOptions));
  response.cookies.set(QIMEIDE_EMAIL_COOKIE, email, withSharedDomain(emailCookieOptions));
}

export function setQimeideDebugCookie(response: NextResponse, value: string) {
  response.cookies.set(QIMEIDE_LOGIN_DEBUG_COOKIE, value, withSharedDomain({ ...emailCookieOptions, maxAge: 10 * 60 }));
}

export function clearQimeideSessionCookies(response: NextResponse) {
  response.cookies.set(QIMEIDE_ACCESS_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(QIMEIDE_REFRESH_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(QIMEIDE_EMAIL_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(QIMEIDE_COOKIE_TEST, "", { path: "/", maxAge: 0 });
  response.cookies.set(QIMEIDE_LOGIN_DEBUG_COOKIE, "", { path: "/", maxAge: 0 });
  const domain = getQimeideCookieDomain();
  if (domain) {
    response.cookies.set(QIMEIDE_ACCESS_COOKIE, "", { path: "/", domain, maxAge: 0 });
    response.cookies.set(QIMEIDE_REFRESH_COOKIE, "", { path: "/", domain, maxAge: 0 });
    response.cookies.set(QIMEIDE_EMAIL_COOKIE, "", { path: "/", domain, maxAge: 0 });
    response.cookies.set(QIMEIDE_COOKIE_TEST, "", { path: "/", domain, maxAge: 0 });
    response.cookies.set(QIMEIDE_LOGIN_DEBUG_COOKIE, "", { path: "/", domain, maxAge: 0 });
  }
}
