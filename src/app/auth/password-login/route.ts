import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { setSupabaseSessionCookies } from "@/lib/supabase/auth-session-cookie";

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

function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && value.includes("@") && value.length <= 254;
}

function isValidPassword(value: unknown): value is string {
  return typeof value === "string" && value.length >= 6 && value.length <= 256;
}

function safeNextPath(value: unknown) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/login")) return "/";
  return value;
}

function redirectWithError(request: NextRequest, message: string, status = 303) {
  const { origin } = new URL(request.url);
  const url = new URL("/login", origin);
  url.searchParams.set("loginError", message);
  return NextResponse.redirect(url, { status });
}

export async function POST(request: NextRequest) {
  let payload: LoginPayload = {};
  const contentType = request.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      payload = (await request.json()) as LoginPayload;
    } else {
      const formData = await request.formData();
      payload = {
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
        next: String(formData.get("next") ?? "")
      };
    }
  } catch {
    return contentType.includes("application/json")
      ? NextResponse.json({ ok: false, message: "\u8bf7\u586b\u5199\u90ae\u7bb1\u548c\u5bc6\u7801\u3002" }, { status: 400 })
      : redirectWithError(request, "\u8bf7\u586b\u5199\u90ae\u7bb1\u548c\u5bc6\u7801\u3002");
  }

  const email = payload.email?.trim();
  const password = payload.password;
  const next = safeNextPath(payload.next);

  if (!isValidEmail(email) || !isValidPassword(password)) {
    return contentType.includes("application/json")
      ? NextResponse.json({ ok: false, message: "\u8bf7\u586b\u5199\u6b63\u786e\u7684\u90ae\u7bb1\u548c\u81f3\u5c11 6 \u4f4d\u5bc6\u7801\u3002" }, { status: 400 })
      : redirectWithError(request, "\u8bf7\u586b\u5199\u6b63\u786e\u7684\u90ae\u7bb1\u548c\u81f3\u5c11 6 \u4f4d\u5bc6\u7801\u3002");
  }

  const { origin } = new URL(request.url);
  const response = contentType.includes("application/json")
    ? NextResponse.json({ ok: true, email })
    : NextResponse.redirect(`${origin}${next}`, { status: 303 });
  response.headers.set("Cache-Control", "no-store");
  let authCookiesSet = 0;
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookieOptions: {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        authCookiesSet += cookiesToSet.filter((cookie) => cookie.name.startsWith("sb-")).length;
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return contentType.includes("application/json")
      ? NextResponse.json({ ok: false, message: "\u90ae\u7bb1\u6216\u5bc6\u7801\u4e0d\u6b63\u786e\uff0c\u8bf7\u68c0\u67e5\u540e\u518d\u8bd5\u3002" }, { status: 401 })
      : redirectWithError(request, "\u90ae\u7bb1\u6216\u5bc6\u7801\u4e0d\u6b63\u786e\uff0c\u8bf7\u68c0\u67e5\u540e\u518d\u8bd5\u3002");
  }

  if (data.session) {
    authCookiesSet += setSupabaseSessionCookies(request, response, data.session);
  }
  await supabase.auth.getSession();
  response.headers.set("X-Qimeide-Auth-Cookies", String(authCookiesSet));

  return response;
}
