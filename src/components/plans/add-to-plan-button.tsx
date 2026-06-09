"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarPlus } from "lucide-react";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { getAddToPlanMessages } from "@/lib/i18n/messages";
import { hasLocalAuthState } from "@/lib/auth/client-auth-state";

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

  async function handleAdd() {
    if (loading) return;
    setLoading(true);
    setError("");
    setMessage("");
    setNeedsLogin(false);

    try {
      const response = await fetch("/api/plans/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({ destinationId })
      });
      const result = (await response.json()) as AddToPlanResponse;

      if (response.status === 401) {
        setNeedsLogin(!hasLocalAuthState());
        setError(hasLocalAuthState() ? "\u767b\u5f55\u5df2\u6210\u529f\uff0c\u4f46\u670d\u52a1\u5668\u8fd8\u6ca1\u8bfb\u5230\u8d26\u53f7\u72b6\u6001\uff0c\u8bf7\u9000\u51fa\u540e\u91cd\u65b0\u767b\u5f55\u4e00\u6b21\u3002" : text.needSignIn);
        return;
      }

      if (!response.ok || !result.ok) throw new Error(result.message ?? "Add to plan failed");

      if (result.alreadyInPlan) {
        setMessage(text.alreadyInPlan);
        return;
      }

      setMessage(text.added);
    } catch {
      setError(text.addFailed);
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
