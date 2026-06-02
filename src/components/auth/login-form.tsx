"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail } from "lucide-react";
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
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo
        }
      });

      if (signInError) {
        setError(text.loginFailed);
        return;
      }

      setMessage(text.magicLinkSent);
    } catch {
      setError(text.loginFailed);
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    setError("");
    setMessage("");
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError(text.loginFailed);
      return;
    }
    setMessage(text.signedOut);
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto flex max-w-md flex-col px-4 py-10 md:px-0">
        <p className="text-sm text-slate-500">WeekendGo {"\u8d26\u53f7"}</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">{text.title}</h1>
        <p className="mt-2 text-sm text-slate-600">
          {text.subtitle}
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <label className="text-sm font-medium text-slate-700" htmlFor="email">
            {"\u90ae\u7bb1"}
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

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {loading ? text.sending : text.sendLink}
          </button>

          <button
            type="button"
            onClick={signOut}
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
          >
            {text.signOut}
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
