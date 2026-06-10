import { createServerClient } from "@supabase/ssr";
import type { Session } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

const MAX_COOKIE_CHUNK_SIZE = 3180;
const AUTH_COOKIE_MAX_AGE = 400 * 24 * 60 * 60;

export const runtime = "nodejs";

function safeNextPath(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/login")) return "/";
  return value;
}

function redirectToLogin(request: NextRequest, message: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("loginError", message);
  return NextResponse.redirect(url, { status: 303 });
}

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
    if (lastEscape > MAX_COOKIE_CHUNK_SIZE - 3) head = head.slice(0, lastEscape);

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

function setSupabaseAuthCookie(response: NextResponse, session: Session) {
  const projectRef = getProjectRef();
  if (!projectRef) return [];

  const cookieName = `sb-${projectRef}-auth-token`;
  const cookieValue = `base64-${toBase64Url(JSON.stringify(session))}`;
  const chunks = chunkCookie(cookieName, cookieValue);
  const options: NonNullable<CookieToSet["options"]> = {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: AUTH_COOKIE_MAX_AGE
  };

  chunks.forEach(({ name, value }) => response.cookies.set(name, value, options));
  return chunks.map((chunk) => chunk.name);
}

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      message: "password-login route is reachable",
      authMethod: "supabase-ssr-password"
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(formData.get("next"));

  if (!email || !email.includes("@") || password.length < 6) {
    return redirectToLogin(request, "请填写正确的邮箱和至少 6 位密码。");
  }

  let response = NextResponse.redirect(new URL(next, request.url), { status: 303 });
  let setCookieCount = 0;
  const cookieNames: string[] = [];

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        setCookieCount += cookiesToSet.length;
        cookieNames.push(...cookiesToSet.map((cookie) => cookie.name));
      }
    }
  });

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error || !data.session || !data.user) {
    console.info("[auth/password-login]", {
      hasSession: false,
      setCookieCount,
      error: error?.message ?? "missing-session"
    });
    return redirectToLogin(request, "邮箱或密码不正确，请检查后再试。");
  }

  await supabase.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token
  });

  const manualCookieNames = setSupabaseAuthCookie(response, data.session);

  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Qimeide-Auth-Method", "supabase-ssr-password");
  response.headers.set("X-Qimeide-Login-Has-Session", "true");
  response.headers.set("X-Qimeide-Supabase-Set-Cookie-Count", String(setCookieCount));
  response.headers.set("X-Qimeide-Supabase-Cookie-Names", cookieNames.join(","));
  response.headers.set("X-Qimeide-Manual-Supabase-Cookie-Names", manualCookieNames.join(","));

  console.info("[auth/password-login]", {
    authMethod: "supabase-ssr-password",
    redirectTo: new URL(next, request.url).toString(),
    hasSession: true,
    setCookieCount,
    cookieNames,
    manualCookieNames,
    host: request.nextUrl.host
  });

  return response;
}
