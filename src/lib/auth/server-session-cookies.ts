import type { NextResponse } from "next/server";

export const QIMEIDE_ACCESS_COOKIE = "qimeide_access_token";
export const QIMEIDE_REFRESH_COOKIE = "qimeide_refresh_token";
export const QIMEIDE_EMAIL_COOKIE = "qimeide_auth_email";

const SESSION_MAX_AGE = 400 * 24 * 60 * 60;

type CookieOptions = Parameters<NextResponse["cookies"]["set"]>[2];

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
  response.cookies.set(QIMEIDE_ACCESS_COOKIE, session.access_token, sessionCookieOptions);
  response.cookies.set(QIMEIDE_REFRESH_COOKIE, session.refresh_token, sessionCookieOptions);
  response.cookies.set(QIMEIDE_EMAIL_COOKIE, email, emailCookieOptions);
}

export function clearQimeideSessionCookies(response: NextResponse) {
  response.cookies.set(QIMEIDE_ACCESS_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(QIMEIDE_REFRESH_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(QIMEIDE_EMAIL_COOKIE, "", { path: "/", maxAge: 0 });
}
