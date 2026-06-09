"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Lock, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Mode = "request" | "update";

function translateAuthError(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("rate limit")) return "操作太频繁，请稍后再试。";
  if (lower.includes("expired")) return "链接已过期，请重新发送找回密码邮件。";
  if (lower.includes("password")) return "密码不符合要求，请至少填写 6 位。";
  return message;
}

export function ResetPasswordForm() {
  const supabase = useMemo(() => createClient(), []);
  const [mode, setMode] = useState<Mode>("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) setMode("update");
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setMode("update");
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  function resetFeedback() {
    setMessage("");
    setError("");
  }

  async function sendResetEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetFeedback();

    const emailValue = email.trim();
    if (!emailValue) {
      setError("请先填写邮箱。");
      return;
    }
    if (!emailValue.includes("@")) {
      setError("请填写正确的邮箱地址。");
      return;
    }

    setLoading(true);
    const redirectTo = `${window.location.origin}/reset-password`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(emailValue, {
      redirectTo
    });
    setLoading(false);

    if (resetError) {
      setError(`发送失败：${translateAuthError(resetError.message)}`);
      return;
    }

    setMessage("找回密码邮件已发送，请打开邮箱里的链接设置新密码。");
  }

  async function updatePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetFeedback();

    if (password.length < 6) {
      setError("新密码至少需要 6 位。");
      return;
    }
    if (password !== confirmPassword) {
      setError("两次输入的新密码不一致。");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(`修改失败：${translateAuthError(updateError.message)}`);
      return;
    }

    setPassword("");
    setConfirmPassword("");
    setMessage("密码修改成功，请使用新密码登录。");
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto flex max-w-md flex-col px-4 py-10 md:px-0">
        <h1 className="text-2xl font-bold text-slate-900">{mode === "update" ? "设置新密码" : "找回密码"}</h1>
        <p className="mt-2 text-sm text-slate-600">
          {mode === "update" ? "请输入新密码，保存后即可使用新密码登录。" : "输入注册邮箱，我们会发送一封找回密码邮件。"}
        </p>

        {mode === "request" ? (
          <form onSubmit={sendResetEmail} className="mt-6 space-y-3 rounded-xl border border-slate-200 bg-white p-4">
            <label className="text-sm font-bold text-slate-900" htmlFor="reset-email">
              {"邮箱"}
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3">
              <Mail className="h-4 w-4 text-slate-500" />
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="h-10 w-full bg-transparent text-sm text-slate-900 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {loading ? "发送中..." : "发送找回密码邮件"}
            </button>
          </form>
        ) : (
          <form onSubmit={updatePassword} className="mt-6 space-y-3 rounded-xl border border-slate-200 bg-white p-4">
            <label className="text-sm font-bold text-slate-900" htmlFor="new-password">
              {"新密码"}
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3">
              <Lock className="h-4 w-4 text-slate-500" />
              <input
                id="new-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="至少 6 位"
                className="h-10 w-full bg-transparent text-sm text-slate-900 outline-none"
              />
            </div>
            <label className="text-sm font-bold text-slate-900" htmlFor="confirm-password">
              {"确认新密码"}
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3">
              <Lock className="h-4 w-4 text-slate-500" />
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="再次输入新密码"
                className="h-10 w-full bg-transparent text-sm text-slate-900 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {loading ? "保存中..." : "保存新密码"}
            </button>
          </form>
        )}

        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

        <div className="mt-4 flex items-center gap-3 text-sm">
          <Link href="/login" className="text-emerald-700 hover:underline">
            {"返回登录"}
          </Link>
          <Link href="/" className="text-slate-600 hover:underline">
            {"返回首页"}
          </Link>
        </div>
      </section>
    </main>
  );
}
