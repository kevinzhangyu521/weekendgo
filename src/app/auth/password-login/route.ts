import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

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

  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Qimeide-Auth-Method", "supabase-ssr-password");
  response.headers.set("X-Qimeide-Login-Has-Session", "true");
  response.headers.set("X-Qimeide-Supabase-Set-Cookie-Count", String(setCookieCount));
  response.headers.set("X-Qimeide-Supabase-Cookie-Names", cookieNames.join(","));

  console.info("[auth/password-login]", {
    authMethod: "supabase-ssr-password",
    redirectTo: new URL(next, request.url).toString(),
    hasSession: true,
    setCookieCount,
    cookieNames,
    host: request.nextUrl.host
  });

  return response;
}
