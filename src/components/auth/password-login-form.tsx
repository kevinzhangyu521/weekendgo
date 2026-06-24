"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  next: string;
  loginError?: string;
};

function LoginErrorAlert({ message, showResetAction }: { message: string; showResetAction: boolean }) {
  return (
    <div
      className="mb-4 flex gap-3 rounded-xl border px-4 py-3.5 text-sm"
      style={{ backgroundColor: "#FEF2F2", borderColor: "#FCA5A5" }}
      role="alert"
      aria-live="polite"
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
      <div>
        <strong className="block font-bold text-red-800">登录失败</strong>
        <p className="mt-1 leading-6 text-red-700">{message}</p>
        {showResetAction ? (
          <div className="mt-3">
            <p className="text-sm font-medium text-red-800">忘记密码？</p>
            <Link
              href="/reset-password"
              className="mt-2 inline-flex h-10 items-center justify-center rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700"
            >
              立即找回
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function PasswordLoginForm({ next, loginError }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [errorMessage, setErrorMessage] = useState(loginError ? "邮箱或密码不正确，请重新输入后再试。" : "");
  const [failedAttempts, setFailedAttempts] = useState(loginError ? 1 : 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage("");
    setStatus("正在登录，请稍候...");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    if (error) {
      const nextFailedAttempts = failedAttempts + 1;
      setFailedAttempts(nextFailedAttempts);
      setErrorMessage(nextFailedAttempts >= 3 ? "邮箱或密码不正确" : "邮箱或密码不正确，请重新输入后再试。");
      setStatus("");
      setIsSubmitting(false);
      return;
    }

    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session?.user) {
      setErrorMessage("浏览器没有保存登录状态，请关闭无痕模式，并确认浏览器允许本站保存数据。");
      setStatus("");
      setIsSubmitting(false);
      return;
    }

    setFailedAttempts(0);
    setStatus("登录成功，正在进入网站...");
    window.location.assign(next || "/");
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
      <div className="space-y-3">
        <label className="text-sm font-bold text-slate-900" htmlFor="email">
          邮箱
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="例如：yourname@qq.com"
          className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-emerald-500"
        />

        <label className="text-sm font-bold text-slate-900" htmlFor="password">
          密码
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="至少 6 位，建议安全好记"
          className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-emerald-500"
        />
      </div>

      <div className="mt-4">
        {errorMessage ? <LoginErrorAlert message={errorMessage} showResetAction={failedAttempts >= 3} /> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "登录中..." : "登录"}
        </button>
      </div>

      <div className="mt-4 space-y-2 text-center text-sm">
        <Link href="/reset-password" className="block text-emerald-700 hover:underline">
          忘记密码？
        </Link>
        <p className="text-slate-600">
          还没有账号？
          <Link href="/register" className="font-medium text-emerald-700 hover:underline">
            立即注册
          </Link>
        </p>
      </div>

      {status ? <p className="mt-3 text-sm text-slate-600">{status}</p> : null}
    </form>
  );
}
