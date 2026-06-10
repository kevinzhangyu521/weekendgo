import type { NextResponse } from "next/server";

export const QIMEIDE_COOKIE_TEST = "qimeide_cookie_test";
export const QIMEIDE_LOGIN_DEBUG_COOKIE = "qimeide_login_debug";

type CookieOptions = Parameters<NextResponse["cookies"]["set"]>[2];

const emailCookieOptions: CookieOptions = {
  path: "/",
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 10 * 60
};

export function clearQimeideSessionCookies(response: NextResponse) {
  response.cookies.set("qimeide_access_token", "", { path: "/", maxAge: 0 });
  response.cookies.set("qimeide_refresh_token", "", { path: "/", maxAge: 0 });
  response.cookies.set("qimeide_auth_email", "", { path: "/", maxAge: 0 });
  response.cookies.set("qimeide_session_id", "", { path: "/", maxAge: 0 });
  response.cookies.set(QIMEIDE_COOKIE_TEST, "", { path: "/", maxAge: 0 });
  response.cookies.set(QIMEIDE_LOGIN_DEBUG_COOKIE, "", { path: "/", maxAge: 0 });
}

export function setQimeideDebugCookie(response: NextResponse, value: string) {
  response.cookies.set(QIMEIDE_LOGIN_DEBUG_COOKIE, value, emailCookieOptions);
}
