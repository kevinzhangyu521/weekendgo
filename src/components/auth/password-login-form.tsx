"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  next: string;
  loginError?: string;
};

export function PasswordLoginForm({ next, loginError }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState(loginError ? `登录失败：${loginError}` : "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setStatus("正在登录，请稍候...");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    if (error) {
      setStatus("登录失败：邮箱或密码不正确，请检查后再试。");
      setIsSubmitting(false);
      return;
    }

    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session?.user) {
      setStatus("登录已通过，但浏览器没有保存会话。请关闭无痕模式，并确认浏览器允许本站保存数据。");
      setIsSubmitting(false);
      return;
    }

    setStatus("登录成功，正在进入网站...");
    window.location.assign(next || "/");
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-3 rounded-xl border border-slate-200 bg-white p-4">
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

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "登录中..." : "登录"}
      </button>

      <Link href="/reset-password" className="block text-center text-sm text-emerald-700 hover:underline">
        忘记密码？
      </Link>

      {status ? <p className="text-sm text-slate-600">{status}</p> : null}
    </form>
  );
}
