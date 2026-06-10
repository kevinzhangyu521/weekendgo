import { createServerClient } from "@supabase/ssr";
import type { AuthError, Session, User } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";
import { setQimeideDebugCookie, setQimeideSessionCookies, setQimeideSessionIdCookie } from "@/lib/auth/server-session-cookies";

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

const messages = {
  missingFields: "\u8bf7\u586b\u5199\u90ae\u7bb1\u548c\u5bc6\u7801\u3002",
  invalidFields: "\u8bf7\u586b\u5199\u6b63\u786e\u7684\u90ae\u7bb1\u548c\u81f3\u5c11 6 \u4f4d\u5bc6\u7801\u3002",
  invalidLogin: "\u90ae\u7bb1\u6216\u5bc6\u7801\u4e0d\u6b63\u786e\uff0c\u8bf7\u68c0\u67e5\u540e\u518d\u8bd5\u3002",
  successTitle: "\u767b\u5f55\u6210\u529f",
  successSaving: "\u6b63\u5728\u4fdd\u5b58\u767b\u5f55\u72b6\u6001\uff0c\u5e76\u4e3a\u4f60\u8fdb\u5165\u7f51\u7ad9...",
  successLink: "\u5982\u679c\u6ca1\u6709\u81ea\u52a8\u8df3\u8f6c\uff0c\u8bf7\u70b9\u8fd9\u91cc\u8fdb\u5165",
  brand: "\u6816\u7f8e\u5730"
};

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

function withDebug(response: NextResponse, value: string) {
  setQimeideDebugCookie(response, value.slice(0, 180));
  response.headers.set("X-Qimeide-Login-Debug", value.slice(0, 180));
  return response;
}

function htmlEscape(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function loginSuccessPage(next: string, sessionId: string, email: string) {
  const safeNext = htmlEscape(next);
  const encodedSessionId = encodeURIComponent(sessionId);
  const encodedEmail = encodeURIComponent(email);
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="refresh" content="1;url=${safeNext}" />
    <title>${messages.successTitle} - ${messages.brand}</title>
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
      <h1>${messages.successTitle}</h1>
      <p>${messages.successSaving}</p>
      <a href="${safeNext}">${messages.successLink}</a>
      <script>
        document.cookie = "qimeide_session_id=${encodedSessionId}; Path=/; Max-Age=34560000; SameSite=Lax";
        document.cookie = "qimeide_auth_email=${encodedEmail}; Path=/; Max-Age=34560000; SameSite=Lax";
        document.cookie = "qimeide_login_debug=${encodeURIComponent(`success:${email}:session-id:browser`)}; Path=/; Max-Age=600; SameSite=Lax";
        window.setTimeout(function () {
          window.location.replace(${JSON.stringify(next)});
        }, 700);
      </script>
    </main>
  </body>
</html>`;
}

function sessionExpiresAt(session: Session) {
  if (session.expires_at) return new Date(session.expires_at * 1000).toISOString();
  return new Date(Date.now() + 60 * 60 * 1000).toISOString();
}

async function saveServerSession(sessionId: string, user: User, session: Session) {
  const supabase = createPublicClient();
  const { error } = await supabase.rpc("save_auth_session", {
    p_session_id: sessionId,
    p_user_id: user.id,
    p_email: user.email ?? null,
    p_access_token: session.access_token,
    p_refresh_token: session.refresh_token,
    p_expires_at: sessionExpiresAt(session)
  });

  return error;
}

export async function GET() {
  return withDebug(
    NextResponse.json(
      {
        ok: true,
        message: "password-login route is reachable"
      },
      {
        headers: {
          "Cache-Control": "no-store"
        }
      }
    ),
    "route-get:password-login"
  );
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
    const response = contentType.includes("application/json")
      ? NextResponse.json({ ok: false, message: messages.missingFields }, { status: 400 })
      : redirectWithError(request, messages.missingFields);
    return withDebug(response, "failed:parse-body");
  }

  const email = payload.email?.trim();
  const password = payload.password;
  const next = safeNextPath(payload.next);

  if (!isValidEmail(email) || !isValidPassword(password)) {
    const response = contentType.includes("application/json")
      ? NextResponse.json({ ok: false, message: messages.invalidFields }, { status: 400 })
      : redirectWithError(request, messages.invalidFields);
    return withDebug(response, "failed:invalid-fields");
  }

  let data: { user: User | null; session: Session | null };
  let error: AuthError | null;

  try {
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
    const result = await supabase.auth.signInWithPassword({ email, password });
    data = result.data;
    error = result.error;
  } catch (err) {
    const response = contentType.includes("application/json")
      ? NextResponse.json({ ok: false, message: messages.invalidLogin }, { status: 500 })
      : redirectWithError(request, messages.invalidLogin);
    const detail = err instanceof Error ? err.message : "unknown-error";
    return withDebug(response, `failed:exception:${detail}`);
  }

  if (error || !data.user || !data.session) {
    const response = contentType.includes("application/json")
      ? NextResponse.json({ ok: false, message: messages.invalidLogin }, { status: 401 })
      : redirectWithError(request, messages.invalidLogin);
    return withDebug(response, error ? `failed:${error.message}` : "failed:no-session");
  }

  const sessionId = crypto.randomUUID();
  const saveError = await saveServerSession(sessionId, data.user, data.session);
  if (saveError) {
    return withDebug(
      contentType.includes("application/json")
        ? NextResponse.json({ ok: false, message: `登录成功，但保存服务端会话失败：${saveError.message}` }, { status: 500 })
        : redirectWithError(request, `登录成功，但保存服务端会话失败：${saveError.message}`),
      `failed:save-session:${saveError.message}`
    );
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
    : new NextResponse(loginSuccessPage(next, sessionId, data.user.email ?? email), {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8"
        }
      });

  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Qimeide-Session-Cookies", "set");
  response.headers.set("X-Qimeide-Auth-Cookies", "3");
  response.headers.set("X-Qimeide-User", data.user.email ?? email);
  withDebug(response, `success:${data.user.email ?? email}:session-id`);
  setQimeideSessionIdCookie(response, sessionId);
  setQimeideSessionCookies(response, data.session, data.user.email ?? email);

  return response;
}
