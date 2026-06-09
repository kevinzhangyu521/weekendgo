import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { setQimeideSessionCookies } from "@/lib/auth/server-session-cookies";

type CookieToSet = {
  name: string;
  value: string;
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

function htmlEscape(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function loginSuccessPage(next: string) {
  const safeNext = htmlEscape(next);
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="refresh" content="1;url=${safeNext}" />
    <title>登录成功 - 栖美地</title>
    <style>
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f8fafc; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      .card { width: min(92vw, 420px); border: 1px solid #dbe5ee; border-radius: 18px; background: white; padding: 28px; box-shadow: 0 10px 30px rgba(15, 23, 42, .08); }
      h1 { margin: 0; font-size: 24px; }
      p { margin: 12px 0 0; color: #475569; line-height: 1.7; }
      a { display: inline-flex; margin-top: 18px; border-radius: 999px; background: #059669; color: white; padding: 10px 16px; text-decoration: none; font-weight: 700; }
    </style>
  </head>
  <body>
    <main class="card">
      <h1>登录成功</h1>
      <p>正在保存登录状态，并为你进入网站...</p>
      <a href="${safeNext}">如果没有自动跳转，请点这里进入</a>
      <script>
        window.setTimeout(function () {
          window.location.replace(${JSON.stringify(next)});
        }, 700);
      </script>
    </main>
  </body>
</html>`;
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
      ? NextResponse.json({ ok: false, message: "请填写邮箱和密码。" }, { status: 400 })
      : redirectWithError(request, "请填写邮箱和密码。");
  }

  const email = payload.email?.trim();
  const password = payload.password;
  const next = safeNextPath(payload.next);

  if (!isValidEmail(email) || !isValidPassword(password)) {
    return contentType.includes("application/json")
      ? NextResponse.json({ ok: false, message: "请填写正确的邮箱和至少 6 位密码。" }, { status: 400 })
      : redirectWithError(request, "请填写正确的邮箱和至少 6 位密码。");
  }

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
      }
    }
  });

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user || !data.session) {
    return contentType.includes("application/json")
      ? NextResponse.json({ ok: false, message: "邮箱或密码不正确，请检查后再试。" }, { status: 401 })
      : redirectWithError(request, "邮箱或密码不正确，请检查后再试。");
  }

  const response = contentType.includes("application/json")
    ? NextResponse.json({
        ok: true,
        email: data.user.email ?? email,
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        }
      })
    : new NextResponse(loginSuccessPage(next), {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8"
        }
      });

  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Qimeide-Session-Cookies", "set");
  response.headers.set("X-Qimeide-Auth-Cookies", "3");
  setQimeideSessionCookies(response, data.session, data.user.email ?? email);

  return response;
}
