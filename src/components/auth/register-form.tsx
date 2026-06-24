"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    setMessage("");
    setError("");

    if (password !== confirmPassword) {
      setError("两次输入的密码不一致，请重新输入。");
      return;
    }

    setIsSubmitting(true);
    setMessage("正在注册，请稍候...");

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password
    });

    if (signUpError) {
      setError(signUpError.message || "注册失败，请稍后再试。");
      setMessage("");
      setIsSubmitting(false);
      return;
    }

    router.push("/login?registered=1");
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
      <div className="space-y-3">
        <label className="text-sm font-bold text-slate-900" htmlFor="register-email">
          邮箱
        </label>
        <input
          id="register-email"
          name="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="例如：yourname@qq.com"
          className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-emerald-500"
        />

        <label className="text-sm font-bold text-slate-900" htmlFor="register-password">
          密码
        </label>
        <input
          id="register-password"
          name="password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="至少 6 位，建议安全好记"
          className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-emerald-500"
        />

        <label className="text-sm font-bold text-slate-900" htmlFor="confirm-password">
          确认密码
        </label>
        <input
          id="confirm-password"
          name="confirmPassword"
          type="password"
          required
          minLength={6}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="再次输入密码"
          className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-emerald-500"
        />
      </div>

      {error ? <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-slate-600">{message}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-4 w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "注册中..." : "注册"}
      </button>
    </form>
  );
}
