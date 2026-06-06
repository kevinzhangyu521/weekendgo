import type { NextRequest, NextResponse } from "next/server";
import type { Session } from "@supabase/supabase-js";

const MAX_COOKIE_CHUNK_SIZE = 3180;
const AUTH_COOKIE_MAX_AGE = 400 * 24 * 60 * 60;

type CookieOptions = Parameters<NextResponse["cookies"]["set"]>[2];

function getProjectRef() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;

  try {
    return new URL(url).hostname.split(".")[0] || null;
  } catch {
    return null;
  }
}

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function chunkCookie(name: string, value: string) {
  const encodedValue = encodeURIComponent(value);
  if (encodedValue.length <= MAX_COOKIE_CHUNK_SIZE) return [{ name, value }];

  const chunks: string[] = [];
  let rest = encodedValue;

  while (rest.length > 0) {
    let head = rest.slice(0, MAX_COOKIE_CHUNK_SIZE);
    const lastEscape = head.lastIndexOf("%");
    if (lastEscape > MAX_COOKIE_CHUNK_SIZE - 3) {
      head = head.slice(0, lastEscape);
    }

    let decoded = "";
    while (head.length > 0) {
      try {
        decoded = decodeURIComponent(head);
        break;
      } catch (error) {
        if (error instanceof URIError && head.at(-3) === "%" && head.length > 3) {
          head = head.slice(0, head.length - 3);
          continue;
        }
        throw error;
      }
    }

    chunks.push(decoded);
    rest = rest.slice(head.length);
  }

  return chunks.map((chunk, index) => ({ name: `${name}.${index}`, value: chunk }));
}

export function setSupabaseSessionCookies(request: NextRequest, response: NextResponse, session: Session) {
  const projectRef = getProjectRef();
  if (!projectRef) return 0;

  const cookieName = `sb-${projectRef}-auth-token`;
  const cookieValue = `base64-${toBase64Url(JSON.stringify(session))}`;
  const chunks = chunkCookie(cookieName, cookieValue);
  const options: CookieOptions = {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: AUTH_COOKIE_MAX_AGE
  };

  request.cookies
    .getAll()
    .filter((cookie) => cookie.name === cookieName || cookie.name.startsWith(`${cookieName}.`))
    .forEach((cookie) => {
      request.cookies.set(cookie.name, "");
      response.cookies.set(cookie.name, "", { path: "/", maxAge: 0 });
    });

  chunks.forEach(({ name, value }) => {
    request.cookies.set(name, value);
    response.cookies.set(name, value, options);
  });

  return chunks.length;
}
