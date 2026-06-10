"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { usePathname } from "next/navigation";

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

export function FavoriteButton({
  destinationId,
  size = "md",
  className = "",
  initialIsFavorite,
  initialIsLoggedIn
}: Props) {
  const pathname = usePathname();
  const hasInitialState = typeof initialIsFavorite === "boolean" || typeof initialIsLoggedIn === "boolean";
  const [loading, setLoading] = useState(!hasInitialState);
  const [saving, setSaving] = useState(false);
  const [isFavorite, setIsFavorite] = useState(Boolean(initialIsFavorite));
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(initialIsLoggedIn));
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackType, setFeedbackType] = useState<"success" | "error">("success");

  async function requestToggleFavorite() {
    const response = await fetch("/api/favorites/toggle", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
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

    try {
      setSaving(true);
      setFeedbackText("");
      const { response, result } = await requestToggleFavorite();

      if (response.status === 401) {
        setIsLoggedIn(false);
        setFeedbackType("error");
        setFeedbackText(result.message ?? "\u767b\u5f55\u540e\u53ef\u4ee5\u6536\u85cf\u3002");
        return;
      }

      if (!response.ok || !result.ok) throw new Error(result.message ?? "Save favorite failed");

      setIsLoggedIn(true);
      setIsFavorite(Boolean(result.isFavorite));
      setFeedbackType("success");
      setFeedbackText(result.message ?? (result.isFavorite ? "已加入收藏。" : "已取消收藏。"));
    } catch (error) {
      const message = error instanceof Error && error.message !== "Save favorite failed" ? error.message : "\u4fdd\u5b58\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002";
      setFeedbackType("error");
      setFeedbackText(message);
    } finally {
      setSaving(false);
    }
  }

  const buttonSize = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  const iconSize = size === "sm" ? "h-4 w-4" : "h-4.5 w-4.5";

  return (
    <div className={className}>
      <button
        type="button"
        onClick={toggleFavorite}
        disabled={loading || saving}
        aria-label={isFavorite ? "\u53d6\u6d88\u6536\u85cf" : "\u52a0\u5165\u6536\u85cf"}
        title={isFavorite ? "\u53d6\u6d88\u6536\u85cf" : "\u52a0\u5165\u6536\u85cf"}
        className={`${buttonSize} inline-flex items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 ${
          isFavorite ? "text-rose-600" : ""
        }`}
      >
        <Heart className={`${iconSize} ${isFavorite ? "fill-current" : ""}`} />
      </button>
      {saving ? <p className="mt-1 text-xs text-slate-500">{"正在保存..."}</p> : null}
      {feedbackText ? <p className={`mt-1 text-xs ${feedbackType === "success" ? "text-emerald-700" : "text-rose-600"}`}>{feedbackText}</p> : null}
      {!isLoggedIn && !loading ? (
        <Link href={`/login?next=${encodeURIComponent(pathname || "/")}`} className="mt-1 inline-flex text-xs text-emerald-700 hover:underline">
          {"\u767b\u5f55\u540e\u6536\u85cf"}
        </Link>
      ) : null}
    </div>
  );
}
