import { createServerClient } from "@supabase/ssr";
import type { Session } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

type LoginPayload = {
  email?: string;
  password?: string;
  next?: string;
};

export const runtime = "nodejs";

const MAX_COOKIE_CHUNK_SIZE = 3180;
const AUTH_COOKIE_MAX_AGE = 400 * 24 * 60 * 60;

function safeNextPath(value: unknown) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/login")) return "/";
  return value;
}

function readRequestCookies(request: NextRequest) {
  return (
    request.headers
      .get("cookie")
      ?.split(";")
      .map((cookie) => {
        const [name, ...rest] = cookie.trim().split("=");
        return {
          name,
          value: rest.join("=")
        };
      })
      .filter((cookie) => cookie.name) ?? []
  );
}

async function readPayload(request: NextRequest): Promise<LoginPayload> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await request.json()) as LoginPayload;
  }

  const formData = await request.formData();
  return {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    next: String(formData.get("next") ?? "")
  };
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
    httpOnly: false,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: AUTH_COOKIE_MAX_AGE
  };

  chunks.forEach(({ name, value }) => {
    response.cookies.set(name, value, options);
  });

  return chunks.map((chunk) => chunk.name);
}

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      message: "password-login route is reachable",
      authMethod: "supabase-ssr-cookie-bridge"
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}

export async function POST(request: NextRequest) {
  let payload: LoginPayload;

  try {
    payload = await readPayload(request);
  } catch {
    return redirectToLogin(request, "Please enter email and password.");
  }

  const email = payload.email?.trim() ?? "";
  const password = payload.password ?? "";
  const next = safeNextPath(payload.next);
  const wantsJson = (request.headers.get("content-type") ?? "").includes("application/json");

  if (!email || !email.includes("@") || password.length < 6) {
    const errorMessage = "Please enter a valid email and a password with at least 6 characters.";
    if (wantsJson) return NextResponse.json({ ok: false, error: errorMessage }, { status: 400 });
    return redirectToLogin(request, errorMessage);
  }

  const response = wantsJson
    ? NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } })
    : NextResponse.redirect(new URL(next, request.url), { status: 303 });
  response.headers.set("Cache-Control", "no-store");

  const setCookieNames: string[] = [];
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookieOptions: {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    },
    cookies: {
      getAll() {
        return readRequestCookies(request);
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          setCookieNames.push(name);
          response.cookies.set(name, value, {
            ...options,
            path: "/",
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production"
          });
        });
      }
    }
  });

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error || !data.user || !data.session) {
    console.info("[auth/password-login]", {
      ok: false,
      error: error?.message ?? "missing-session",
      setCookieNames
    });

    const errorMessage = "Email or password is incorrect.";
    if (wantsJson) return NextResponse.json({ ok: false, error: error?.message ?? errorMessage }, { status: 400 });
    return redirectToLogin(request, errorMessage);
  }

  const manualCookieNames = setSupabaseAuthCookie(response, data.session);

  response.headers.set("x-debug-user-email", data.user.email ?? "");
  response.headers.set("x-debug-has-session", "true");
  response.headers.set("x-debug-set-cookie-names", setCookieNames.join(","));
  response.headers.set("x-debug-set-cookie-count", String(setCookieNames.length));
  response.headers.set("x-debug-manual-cookie-names", manualCookieNames.join(","));
  response.headers.set("x-debug-has-manual-cookie", manualCookieNames.length > 0 ? "true" : "false");

  console.info("[auth/password-login]", {
    ok: true,
    email: data.user.email,
    hasSession: Boolean(data.session),
    setCookieNames,
    setCookieCount: setCookieNames.length,
    manualCookieNames
  });

  return response;
}
