"use client";

import Link from "next/link";
import { useState } from "react";

type Props = {
  next: string;
  loginError?: string;
};

export function PasswordLoginForm({ next, loginError }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState(loginError ? `\u767b\u5f55\u5931\u8d25\uff1a${loginError}` : "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setStatus("\u6b63\u5728\u767b\u5f55\uff0c\u8bf7\u7a0d\u5019...");

    const loginResponse = await fetch("/auth/password-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      cache: "no-store",
      body: JSON.stringify({
        email: email.trim(),
        password,
        next
      })
    }).catch(() => null);

    if (!loginResponse?.ok) {
      setStatus("\u767b\u5f55\u5931\u8d25\uff1a\u90ae\u7bb1\u6216\u5bc6\u7801\u4e0d\u6b63\u786e\uff0c\u8bf7\u68c0\u67e5\u540e\u518d\u8bd5\u3002");
      setIsSubmitting(false);
      return;
    }

    const debugResponse = await fetch("/api/debug-current-user", {
      cache: "no-store",
      credentials: "include"
    }).catch(() => null);
    const debug = (await debugResponse?.json().catch(() => null)) as { hasUser?: boolean; hasSupabaseAuthCookie?: boolean; hasSiteSessionCookie?: boolean } | null;

    if (!debug?.hasUser || (!debug.hasSupabaseAuthCookie && !debug.hasSiteSessionCookie)) {
      setStatus("\u767b\u5f55\u6210\u529f\uff0c\u4f46\u7ad9\u5185\u72b6\u6001\u8fd8\u672a\u751f\u6548\uff0c\u8bf7\u5237\u65b0\u540e\u518d\u8bd5\u3002");
      setIsSubmitting(false);
      return;
    }

    setStatus("\u767b\u5f55\u6210\u529f\uff0c\u6b63\u5728\u8fdb\u5165\u7f51\u7ad9...");
    window.location.assign(next || "/");
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <label className="text-sm font-bold text-slate-900" htmlFor="email">
        {"\u90ae\u7bb1"}
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="\u4f8b\u5982\uff1ayourname@qq.com"
        className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-emerald-500"
      />

      <label className="text-sm font-bold text-slate-900" htmlFor="password">
        {"\u5bc6\u7801"}
      </label>
      <input
        id="password"
        name="password"
        type="password"
        required
        minLength={6}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="\u81f3\u5c11 6 \u4f4d\uff0c\u5efa\u8bae\u5b89\u5168\u597d\u8bb0"
        className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-emerald-500"
      />

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "\u767b\u5f55\u4e2d..." : "\u767b\u5f55"}
      </button>

      <Link href="/reset-password" className="block text-center text-sm text-emerald-700 hover:underline">
        {"\u5fd8\u8bb0\u5bc6\u7801\uff1f"}
      </Link>

      {status ? <p className="text-sm text-slate-600">{status}</p> : null}
    </form>
  );
}
