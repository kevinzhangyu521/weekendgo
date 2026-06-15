import type { NextResponse } from "next/server";

export const QIMEIDE_COOKIE_TEST = "qimeide_cookie_test";
export const QIMEIDE_LOGIN_DEBUG_COOKIE = "qimeide_login_debug";
export const QIMEIDE_ACCESS_TOKEN_COOKIE = "qimeide_access_token";
export const QIMEIDE_REFRESH_TOKEN_COOKIE = "qimeide_refresh_token";

type CookieOptions = Parameters<NextResponse["cookies"]["set"]>[2];

const emailCookieOptions: CookieOptions = {
  path: "/",
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 10 * 60
};

const sessionCookieOptions: CookieOptions = {
  path: "/",
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  httpOnly: true,
  maxAge: 7 * 24 * 60 * 60
};

export function clearQimeideSessionCookies(response: NextResponse) {
  response.cookies.set(QIMEIDE_ACCESS_TOKEN_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(QIMEIDE_REFRESH_TOKEN_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set("qimeide_auth_email", "", { path: "/", maxAge: 0 });
  response.cookies.set("qimeide_session_id", "", { path: "/", maxAge: 0 });
  response.cookies.set(QIMEIDE_COOKIE_TEST, "", { path: "/", maxAge: 0 });
  response.cookies.set(QIMEIDE_LOGIN_DEBUG_COOKIE, "", { path: "/", maxAge: 0 });
}

export function setQimeideSessionCookies(response: NextResponse, accessToken: string, refreshToken: string) {
  response.cookies.set(QIMEIDE_ACCESS_TOKEN_COOKIE, accessToken, sessionCookieOptions);
  response.cookies.set(QIMEIDE_REFRESH_TOKEN_COOKIE, refreshToken, sessionCookieOptions);
}

export function setQimeideDebugCookie(response: NextResponse, value: string) {
  response.cookies.set(QIMEIDE_LOGIN_DEBUG_COOKIE, value, emailCookieOptions);
}
