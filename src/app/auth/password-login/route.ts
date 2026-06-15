import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { setQimeideDebugCookie, setQimeideSessionCookies } from "@/lib/auth/server-session-cookies";
import { setSupabaseAuthCookie } from "@/lib/supabase/session-cookie";

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
  setQimeideSessionCookies(response, data.session.access_token, data.session.refresh_token);
  setQimeideDebugCookie(response, `password-login-ok:${data.user.email ?? "unknown"}`);

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
