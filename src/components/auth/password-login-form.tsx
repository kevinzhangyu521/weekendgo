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
  const [status, setStatus] = useState(loginError ? `\u767b\u5f55\u5931\u8d25\uff1a${loginError}` : "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setStatus("\u6b63\u5728\u767b\u5f55\uff0c\u8bf7\u7a0d\u5019...");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    if (error) {
      setStatus("\u767b\u5f55\u5931\u8d25\uff1a\u90ae\u7bb1\u6216\u5bc6\u7801\u4e0d\u6b63\u786e\uff0c\u8bf7\u68c0\u67e5\u540e\u518d\u8bd5\u3002");
      setIsSubmitting(false);
      return;
    }

    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session?.user) {
      setStatus("\u767b\u5f55\u5df2\u901a\u8fc7\uff0c\u4f46\u6d4f\u89c8\u5668\u6ca1\u6709\u4fdd\u5b58\u4f1a\u8bdd\u3002\u8bf7\u5173\u95ed\u65e0\u75d5\u6a21\u5f0f\uff0c\u5e76\u786e\u8ba4\u6d4f\u89c8\u5668\u5141\u8bb8\u672c\u7ad9\u4fdd\u5b58\u6570\u636e\u3002");
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
