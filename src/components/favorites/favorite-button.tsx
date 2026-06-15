"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
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
  const [feedbackType, setFeedbackType] = useState<"success" | "error">("success");

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
      setFeedbackType("error");
      setFeedbackText("\u767b\u5f55\u72b6\u6001\u5df2\u5931\u6548\uff0c\u8bf7\u91cd\u65b0\u767b\u5f55");
      return;
    }

    try {
      setSaving(true);
      const { response, result } = await requestToggleFavorite();

      if (response.status === 401) {
        setFeedbackType("error");
        setFeedbackText(
          process.env.NODE_ENV !== "production" && result.message
            ? result.message
            : "\u767b\u5f55\u72b6\u6001\u5df2\u5931\u6548\uff0c\u8bf7\u91cd\u65b0\u767b\u5f55"
        );
        return;
      }

      if (!response.ok || !result.ok) throw new Error(result.message ?? "Save favorite failed");

      setIsFavorite(Boolean(result.isFavorite));
      setFeedbackType("success");
      setFeedbackText(result.message ?? (result.isFavorite ? "\u5df2\u52a0\u5165\u6536\u85cf\uff0c\u53ef\u5728\u201c\u6211\u7684\u6536\u85cf\u201d\u67e5\u770b\u3002" : "\u5df2\u53d6\u6d88\u6536\u85cf\u3002"));
    } catch (error) {
      const message = error instanceof Error && error.message !== "Save favorite failed" ? error.message : "\u4fdd\u5b58\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002";
      setFeedbackType("error");
      setFeedbackText(message);
    } finally {
      setSaving(false);
    }
  }

  const buttonPadding = size === "sm" ? "px-3" : "px-3.5";
  const iconSize = size === "sm" ? "h-4 w-4" : "h-4.5 w-4.5";

  return (
    <div className={className}>
      <button
        type="button"
        onClick={toggleFavorite}
        disabled={loading || saving || currentUser.isLoading}
        aria-label={isFavorite ? "\u53d6\u6d88\u6536\u85cf" : "\u52a0\u5165\u6536\u85cf"}
        title={isFavorite ? "\u53d6\u6d88\u6536\u85cf" : "\u52a0\u5165\u6536\u85cf"}
        className={`${buttonPadding} inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 ${
          isFavorite ? "text-rose-600" : ""
        }`}
      >
        <Heart className={`${iconSize} ${isFavorite ? "fill-current" : ""}`} />
        <span>{currentUser.isAuthenticated ? (isFavorite ? "\u5df2\u6536\u85cf" : "\u6536\u85cf") : "\u767b\u5f55\u540e\u6536\u85cf"}</span>
      </button>
      {saving ? <p className="mt-1 text-xs text-slate-500">{"\u6b63\u5728\u4fdd\u5b58..."}</p> : null}
      {feedbackText ? (
        <p className={`mt-2 max-w-[240px] rounded-xl px-3 py-2 text-xs ${feedbackType === "success" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>
          {feedbackText}
        </p>
      ) : null}
    </div>
  );
}
