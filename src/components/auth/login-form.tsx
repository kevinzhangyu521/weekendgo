"use client";

import { type FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Lock, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Locale } from "@/lib/i18n/config";
import { getLoginMessages } from "@/lib/i18n/messages";

type Props = {
  locale: Locale;
  initialEmail: string | null;
};

type AuthAction = "login" | "signup";

type LoginFields = {
  email: string;
  password: string;
};

type PasswordLoginResponse = {
  ok?: boolean;
  email?: string | null;
  message?: string;
  debug?: string | null;
  session?: {
    access_token: string;
    refresh_token: string;
  } | null;
};

const LOGIN_FORM_VERSION = "login-flow-2026-06-10-v2";

function pick(locale: Locale, en: string, zh: string) {
  return locale === "zh" ? zh : en;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs = 30000, timeoutMessage = "\u8bf7\u6c42\u8d85\u65f6\uff0c\u8bf7\u68c0\u67e5\u7f51\u7edc\u540e\u518d\u8bd5\u3002"): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    promise
      .then((value) => {
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timer);
        reject(error);
      });
  });
}

function translateAuthError(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) return "\u90ae\u7bb1\u6216\u5bc6\u7801\u4e0d\u6b63\u786e\uff0c\u8bf7\u68c0\u67e5\u540e\u518d\u8bd5\u3002";
  if (lower.includes("email not confirmed")) return "\u8d26\u53f7\u8fd8\u6ca1\u6709\u5b8c\u6210\u90ae\u7bb1\u786e\u8ba4\uff0c\u8bf7\u5148\u53bb\u90ae\u7bb1\u5b8c\u6210\u786e\u8ba4\u3002";
  if (lower.includes("already registered") || lower.includes("user already registered")) return "\u8fd9\u4e2a\u90ae\u7bb1\u5df2\u7ecf\u6ce8\u518c\u8fc7\uff0c\u8bf7\u76f4\u63a5\u767b\u5f55\u3002";
  if (lower.includes("password")) return "\u5bc6\u7801\u4e0d\u7b26\u5408\u8981\u6c42\uff0c\u8bf7\u81f3\u5c11\u586b\u5199 6 \u4f4d\u3002";
  return message;
}

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  if (value.startsWith("/login")) return "/";
  return value;
}

export function LoginForm({ locale, initialEmail }: Props) {
  const text = getLoginMessages(locale);
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const next = safeNextPath(searchParams.get("next"));
  const confirmed = searchParams.get("confirmed") === "1";
  const loginError = searchParams.get("loginError");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [currentEmail, setCurrentEmail] = useState(initialEmail);
  const [loadingAction, setLoadingAction] = useState<AuthAction | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loginDebug, setLoginDebug] = useState("");

  function resetFeedback() {
    setError("");
    setMessage("");
  }

  function validateFields(): LoginFields | null {
    const emailValue = email.trim();
    if (!emailValue) {
      setError("\u8bf7\u5148\u586b\u5199\u90ae\u7bb1\u3002");
      return null;
    }
    if (!emailValue.includes("@")) {
      setError("\u8bf7\u586b\u5199\u6b63\u786e\u7684\u90ae\u7bb1\u5730\u5740\u3002");
      return null;
    }
    if (!password) {
      setError("\u8bf7\u5148\u586b\u5199\u5bc6\u7801\u3002");
      return null;
    }
    if (password.length < 6) {
      setError("\u5bc6\u7801\u81f3\u5c11\u9700\u8981 6 \u4f4d\u3002");
      return null;
    }
    return { email: emailValue, password };
  }

  async function requestPasswordLogin(fields: LoginFields) {
    setLoginDebug("正在请求 /auth/password-login");
    const response = await withTimeout(
      fetch("/auth/password-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({
          email: fields.email,
          password: fields.password,
          next
        })
      }),
      45000,
      "\u7f51\u7ad9\u767b\u5f55\u63a5\u53e3\u54cd\u5e94\u8d85\u65f6\uff0c\u53ef\u80fd\u662f\u5f53\u524d\u7f51\u7edc\u5230\u670d\u52a1\u5668\u8f83\u6162\uff0c\u6216\u670d\u52a1\u5668\u6b63\u5728\u51b7\u542f\u52a8\u3002\u8bf7\u518d\u8bd5\u4e00\u6b21\u3002"
    );

    const result = (await response.json()) as PasswordLoginResponse;
    const serverDebug = response.headers.get("X-Qimeide-Login-Debug") ?? result.debug ?? "未收到服务端诊断头";
    setLoginDebug(serverDebug);
    if (!response.ok || !result.ok) {
      throw new Error(translateAuthError(result.message ?? "\u8bf7\u68c0\u67e5\u90ae\u7bb1\u548c\u5bc6\u7801\u540e\u518d\u8bd5\u3002"));
    }
    return result;
  }

  function persistLocalAuthState(result: PasswordLoginResponse, fallbackEmail: string) {
    const verifiedEmail = result.email ?? fallbackEmail;
    window.localStorage.setItem("qimeide_auth_email", verifiedEmail);
    document.cookie = `qimeide_auth_email=${encodeURIComponent(verifiedEmail)}; Path=/; Max-Age=34560000; SameSite=Lax`;
    setCurrentEmail(verifiedEmail);
  }

  function warmBrowserSession(result: PasswordLoginResponse) {
    if (!result.session?.access_token || !result.session.refresh_token) return;

    void supabase.auth.setSession(result.session).catch((sessionError) => {
      console.warn("Browser auth session warm-up failed", sessionError);
    });
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetFeedback();
    const fields = validateFields();
    if (!fields) {
      return;
    }

    setLoadingAction("login");
    setMessage("\u6b63\u5728\u767b\u5f55\uff0c\u5982\u679c\u7f51\u7edc\u8f83\u6162\u8bf7\u7a0d\u5019...");

    try {
      const result = await requestPasswordLogin(fields);
      persistLocalAuthState(result, fields.email);
      warmBrowserSession(result);
      setMessage("\u767b\u5f55\u6210\u529f\uff0c\u6b63\u5728\u8fdb\u5165\u7f51\u7ad9...");
      window.location.replace(next);
    } catch (err) {
      const detail = err instanceof Error ? err.message : "\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002";
      setMessage("");
      setError(`\u767b\u5f55\u5931\u8d25\uff1a${detail}`);
      setLoadingAction(null);
    }
  }

  async function signUp() {
    resetFeedback();
    const fields = validateFields();
    if (!fields) return;

    setLoadingAction("signup");
    setMessage("\u6b63\u5728\u6ce8\u518c\uff0c\u8bf7\u7a0d\u5019...");

    try {
      const { data, error: signUpError } = await withTimeout(supabase.auth.signUp(fields));

      if (signUpError) {
        setMessage("");
        setError(`\u6ce8\u518c\u5931\u8d25\uff1a${translateAuthError(signUpError.message)}`);
        return;
      }

      if (data.session) {
        const result = await requestPasswordLogin(fields);
        persistLocalAuthState(result, fields.email);
        warmBrowserSession(result);
        setMessage("\u6ce8\u518c\u6210\u529f\uff0c\u6b63\u5728\u8fdb\u5165\u9996\u9875...");
        window.location.replace("/");
        return;
      }

      setMessage("\u6ce8\u518c\u7533\u8bf7\u5df2\u63d0\u4ea4\u3002\u8bf7\u6253\u5f00\u90ae\u7bb1\u91cc\u7684\u786e\u8ba4\u90ae\u4ef6\uff0c\u70b9\u51fb\u786e\u8ba4\u94fe\u63a5\u540e\u518d\u56de\u5230\u672c\u9875\u767b\u5f55\u3002");
    } catch (err) {
      const detail = err instanceof Error ? err.message : "\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002";
      setMessage("");
      setError(`\u6ce8\u518c\u5931\u8d25\uff1a${detail}`);
    } finally {
      setLoadingAction(null);
    }
  }

  const isSignedIn = Boolean(currentEmail);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto flex max-w-md flex-col px-4 py-10 md:px-0">
        <h1 className="text-2xl font-bold text-slate-900">{pick(locale, "Email and password sign in", "\u90ae\u7bb1\u5bc6\u7801\u767b\u5f55")}</h1>
        <p className="mt-2 text-sm text-slate-600">{pick(locale, "Use your email and password to sign in.", "\u4f7f\u7528\u90ae\u7bb1\u548c\u5bc6\u7801\u767b\u5f55\u3002")}</p>

        {confirmed ? (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <p className="font-semibold">{"\u6ce8\u518c\u786e\u8ba4\u6210\u529f"}</p>
            <p className="mt-1">{"\u8bf7\u5728\u4e0b\u65b9\u8f93\u5165\u90ae\u7bb1\u548c\u5bc6\u7801\u767b\u5f55\u3002"}</p>
          </div>
        ) : null}

        {isSignedIn ? (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <p className="font-semibold">{"\u5f53\u524d\u5df2\u767b\u5f55"}</p>
            <p className="mt-1">{currentEmail}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/" className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white">
                {"\u8fdb\u5165\u9996\u9875"}
              </Link>
              <Link href="/reset-password" className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-medium text-emerald-700">
                {"\u4fee\u6539\u5bc6\u7801"}
              </Link>
              <Link href="/auth/sign-out" className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-medium text-emerald-700">
                {text.signOut}
              </Link>
            </div>
          </div>
        ) : null}

        {!isSignedIn ? (
          <form onSubmit={login} className="mt-6 space-y-3 rounded-xl border border-slate-200 bg-white p-4">
            <input type="hidden" name="next" value={next} />
            <label className="text-sm font-bold text-slate-900" htmlFor="email">
              {"\u90ae\u7bb1"}
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3">
              <Mail className="h-4 w-4 text-slate-500" />
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={pick(locale, "For example: yourname@qq.com", "\u4f8b\u5982\uff1ayourname@qq.com")}
                className="h-10 w-full bg-transparent text-sm text-slate-900 outline-none"
              />
            </div>

            <label className="text-sm font-bold text-slate-900" htmlFor="password">
              {"\u5bc6\u7801"}
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3">
              <Lock className="h-4 w-4 text-slate-500" />
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={pick(locale, "At least 6 characters, safe and easy to remember", "\u81f3\u5c11 6 \u4f4d\uff0c\u5efa\u8bae\u5b89\u5168\u597d\u8bb0")}
                className="h-10 w-full bg-transparent text-sm text-slate-900 outline-none"
              />
            </div>

            <button type="submit" disabled={loadingAction !== null} className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
              {loadingAction === "login" ? "\u767b\u5f55\u4e2d..." : "\u767b\u5f55"}
            </button>

            <Link href="/reset-password" className="block text-center text-sm text-emerald-700 hover:underline">
              {"\u5fd8\u8bb0\u5bc6\u7801\uff1f"}
            </Link>

            <button type="button" onClick={signUp} disabled={loadingAction !== null} className="w-full rounded-lg border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-700 disabled:opacity-60">
              {loadingAction === "signup" ? "\u6ce8\u518c\u4e2d..." : "\u6ce8\u518c\u65b0\u8d26\u53f7"}
            </button>

            {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
            {loginDebug ? <p className="text-xs text-slate-500">{"登录请求诊断："}{loginDebug}</p> : null}
            {loginError ? (
              <p className="text-sm text-rose-600">
                {"\u767b\u5f55\u5931\u8d25\uff1a"}
                {loginError}
              </p>
            ) : null}
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          </form>
        ) : null}

        <div className="mt-4 flex items-center gap-3 text-sm">
          <Link href={next} className="text-emerald-700 hover:underline">
            {text.back}
          </Link>
          <Link href="/" className="text-slate-600 hover:underline">
            {text.home}
          </Link>
        </div>
        <p className="mt-3 text-center text-[11px] text-slate-400">{LOGIN_FORM_VERSION}</p>
      </section>
    </main>
  );
}
