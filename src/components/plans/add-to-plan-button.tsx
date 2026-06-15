"use client";

import { useState } from "react";
import { CalendarPlus } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { getAddToPlanMessages } from "@/lib/i18n/messages";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/auth/use-current-user";

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
  const currentUser = useCurrentUser();
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

    if (!currentUser.isAuthenticated) {
      setNeedsLogin(true);
      setError("\u767b\u5f55\u72b6\u6001\u5df2\u5931\u6548\uff0c\u8bf7\u91cd\u65b0\u767b\u5f55");
      setLoading(false);
      return;
    }

    try {
      setMessage("\u6b63\u5728\u52a0\u5165\u8ba1\u5212...");
      const { response, result } = await requestAddToPlan();

      if (response.status === 401) {
        setNeedsLogin(true);
        setError(
          process.env.NODE_ENV !== "production" && result.message
            ? result.message
            : "\u767b\u5f55\u72b6\u6001\u5df2\u5931\u6548\uff0c\u8bf7\u91cd\u65b0\u767b\u5f55"
        );
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
        className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
      >
        <CalendarPlus className="h-4 w-4" />
        {loading ? text.adding : currentUser.isAuthenticated ? text.addToPlan : "\u767b\u5f55\u540e\u52a0\u5165\u8ba1\u5212"}
      </button>
      {message ? <p className="mt-1 text-xs text-emerald-700">{message}</p> : null}
      {error ? <p className="mt-2 max-w-[240px] rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">{error}</p> : null}
    </div>
  );
}
