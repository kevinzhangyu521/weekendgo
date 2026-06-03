"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Locale } from "@/lib/i18n/config";
import { getLoginMessages } from "@/lib/i18n/messages";

type Props = {
  locale: Locale;
};

export function LoginForm({ locale }: Props) {
  const text = getLoginMessages(locale);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const next = searchParams.get("next") ?? "/favorites";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loadingAction, setLoadingAction] = useState<"login" | "signup" | "signout" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function resetFeedback() {
    setError("");
    setMessage("");
  }

  function validatePassword() {
    if (password.length < 6) {
      setError("密码至少需要 6 位。");
      return false;
    }
    return true;
  }

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email || !validatePassword()) return;

    setLoadingAction("login");
    resetFeedback();

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        setError(`登录失败：${signInError.message}`);
        return;
      }

      router.push(next);
      router.refresh();
    } catch (err) {
      const detail = err instanceof Error ? err.message : "请稍后再试。";
      setError(`登录失败：${detail}`);
    } finally {
      setLoadingAction(null);
    }
  }

  async function signUp() {
    if (!email || !validatePassword()) return;

    setLoadingAction("signup");
    resetFeedback();

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password
      });

      if (signUpError) {
        setError(`注册失败：${signUpError.message}`);
        return;
      }

      if (data.session) {
        router.push(next);
        router.refresh();
        return;
      }

      setMessage("注册成功，请按页面提示继续登录。");
    } catch (err) {
      const detail = err instanceof Error ? err.message : "请稍后再试。";
      setError(`注册失败：${detail}`);
    } finally {
      setLoadingAction(null);
    }
  }

  async function signOut() {
    resetFeedback();
    setLoadingAction("signout");

    const { error: signOutError } = await supabase.auth.signOut();
    setLoadingAction(null);

    if (signOutError) {
      setError(`退出登录失败：${signOutError.message}`);
      return;
    }

    setMessage(text.signedOut);
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto flex max-w-md flex-col px-4 py-10 md:px-0">
        <p className="text-sm text-slate-500">{"栖美地账号"}</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">{"邮箱密码登录"}</h1>
        <p className="mt-2 text-sm text-slate-600">
          {"使用邮箱和密码登录栖美地，不需要再去邮箱点击登录链接。"}
        </p>

        <form onSubmit={login} className="mt-6 space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <label className="text-sm font-bold text-slate-900" htmlFor="email">
            {"邮箱"}
          </label>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3">
            <Mail className="h-4 w-4 text-slate-500" />
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="h-10 w-full bg-transparent text-sm text-slate-900 outline-none"
            />
          </div>

          <label className="text-sm font-bold text-slate-900" htmlFor="password">
            {"密码"}
          </label>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3">
            <Lock className="h-4 w-4 text-slate-500" />
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="至少 6 位"
              className="h-10 w-full bg-transparent text-sm text-slate-900 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loadingAction !== null}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {loadingAction === "login" ? "登录中..." : "登录"}
          </button>

          <button
            type="button"
            onClick={signUp}
            disabled={loadingAction !== null}
            className="w-full rounded-lg border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-700 disabled:opacity-60"
          >
            {loadingAction === "signup" ? "注册中..." : "注册新账号"}
          </button>

          <button
            type="button"
            onClick={signOut}
            disabled={loadingAction !== null}
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-60"
          >
            {loadingAction === "signout" ? "退出中..." : text.signOut}
          </button>

          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        </form>

        <div className="mt-4 flex items-center gap-3 text-sm">
          <Link href={next} className="text-emerald-700 hover:underline">
            {text.back}
          </Link>
          <Link href="/" className="text-slate-600 hover:underline">
            {text.home}
          </Link>
        </div>
      </section>
    </main>
  );
}
