"use client";

import { useEffect, useState } from "react";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { createClient } from "@/lib/supabase/client";

type Props = {
  destinationId: string;
  size?: "sm" | "md";
  className?: string;
  initialIsFavorite?: boolean;
  initialIsLoggedIn?: boolean;
};

type ToggleFavoriteResponse = {
  ok?: boolean;
  isFavorite?: boolean;
  message?: string;
};

export function FavoriteButton({ destinationId, size = "md", className = "", initialIsFavorite, initialIsLoggedIn }: Props) {
  const currentUser = useCurrentUser();
  const hasInitialState = typeof initialIsFavorite === "boolean" || typeof initialIsLoggedIn === "boolean";
  const [loading, setLoading] = useState(!hasInitialState);
  const [saving, setSaving] = useState(false);
  const [isFavorite, setIsFavorite] = useState(Boolean(initialIsFavorite));
  const [feedbackText, setFeedbackText] = useState("");

  async function requestToggleFavorite() {
    const supabase = createClient();
    const {
      data: { session }
    } = await supabase.auth.getSession();
    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;

    const response = await fetch("/api/favorites/toggle", {
      method: "POST",
      headers,
      credentials: "include",
      cache: "no-store",
      body: JSON.stringify({ destinationId })
    });
    const result = (await response.json()) as ToggleFavoriteResponse;
    return { response, result };
  }

  useEffect(() => {
    if (hasInitialState) return;
    setLoading(false);
  }, [hasInitialState]);

  async function toggleFavorite() {
    if (loading || saving) return;
    setFeedbackText("");

    if (!currentUser.isAuthenticated) {
      setFeedbackText("\u767b\u5f55\u72b6\u6001\u5df2\u5931\u6548\uff0c\u8bf7\u91cd\u65b0\u767b\u5f55");
      return;
    }

    try {
      setSaving(true);
      const { response, result } = await requestToggleFavorite();

      if (response.status === 401) {
        setFeedbackText(
          process.env.NODE_ENV !== "production" && result.message
            ? result.message
            : "\u767b\u5f55\u72b6\u6001\u5df2\u5931\u6548\uff0c\u8bf7\u91cd\u65b0\u767b\u5f55"
        );
        return;
      }

      if (!response.ok || !result.ok) throw new Error(result.message ?? "保存收藏失败");

      setIsFavorite(Boolean(result.isFavorite));
      setFeedbackText("");
    } catch (error) {
      const message = error instanceof Error && error.message !== "保存收藏失败" ? error.message : "\u4fdd\u5b58\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002";
      setFeedbackText(message);
    } finally {
      setSaving(false);
    }
  }

  const buttonPadding = size === "sm" ? "px-3" : "px-3.5";
  const buttonTone = isFavorite ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50";
  const label = saving ? "\u4fdd\u5b58\u4e2d..." : currentUser.isAuthenticated ? (isFavorite ? "\u2764\ufe0f \u5df2\u6536\u85cf" : "\u2661 \u6536\u85cf") : "\u767b\u5f55\u540e\u6536\u85cf";

  return (
    <div className={className}>
      <button
        type="button"
        onClick={toggleFavorite}
        disabled={loading || saving || currentUser.isLoading}
        aria-label={isFavorite ? "\u53d6\u6d88\u6536\u85cf" : "\u52a0\u5165\u6536\u85cf"}
        title={isFavorite ? "\u53d6\u6d88\u6536\u85cf" : "\u52a0\u5165\u6536\u85cf"}
        className={`interactive-button ${buttonPadding} inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border text-sm font-medium disabled:opacity-50 ${buttonTone}`}
      >
        <span>{label}</span>
      </button>
      {feedbackText ? (
        <p className="mt-2 max-w-[240px] rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {feedbackText}
        </p>
      ) : null}
    </div>
  );
}
