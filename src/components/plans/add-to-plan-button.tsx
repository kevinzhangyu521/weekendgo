"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarPlus } from "lucide-react";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { getAddToPlanMessages } from "@/lib/i18n/messages";
import { createClient } from "@/lib/supabase/client";

type Props = {
  destinationId: string;
  locale: Locale;
};

type AddToPlanResponse = {
  ok?: boolean;
  alreadyInPlan?: boolean;
  message?: string;
};

export function AddToPlanButton({ destinationId, locale }: Props) {
  const text = getAddToPlanMessages(locale);
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);

  async function requestAddToPlan() {
    const supabase = createClient();
    const {
      data: { session }
    } = await supabase.auth.getSession();
    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;

    const response = await fetch("/api/plans/add", {
      method: "POST",
      headers,
      credentials: "include",
      cache: "no-store",
      body: JSON.stringify({ destinationId })
    });
    const result = (await response.json()) as AddToPlanResponse;
    return { response, result };
  }

  async function handleAdd() {
    if (loading) return;
    setLoading(true);
    setError("");
    setMessage("");
    setNeedsLogin(false);

    try {
      setMessage("\u6b63\u5728\u52a0\u5165\u8ba1\u5212...");
      const { response, result } = await requestAddToPlan();

      if (response.status === 401) {
        setNeedsLogin(true);
        setError(result.message ?? text.needSignIn);
        return;
      }

      if (!response.ok || !result.ok) throw new Error(result.message ?? "Add to plan failed");

      if (result.alreadyInPlan) {
        setMessage(result.message ?? text.alreadyInPlan);
        return;
      }

      setMessage(result.message ?? text.added);
    } catch (error) {
      const detail = error instanceof Error && error.message !== "Add to plan failed" ? error.message : text.addFailed;
      setError(detail);
      setMessage("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleAdd}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
      >
        <CalendarPlus className="h-4 w-4" />
        {loading ? text.adding : text.addToPlan}
      </button>
      {message ? <p className="mt-1 text-xs text-emerald-700">{message}</p> : null}
      {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
      {needsLogin ? (
        <Link href={`/login?next=${encodeURIComponent(pathname || "/")}`} className="mt-1 inline-flex text-xs text-emerald-700 hover:underline">
          {text.signInFirst}
        </Link>
      ) : null}
    </div>
  );
}
