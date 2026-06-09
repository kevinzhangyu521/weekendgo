"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart } from "lucide-react";
import { hasLocalAuthState } from "@/lib/auth/client-auth-state";

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
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    if (hasLocalAuthState()) {
      setIsLoggedIn(true);
    }

    if (hasInitialState) return;

    setLoading(false);
  }, [hasInitialState]);

  async function toggleFavorite() {
    if (loading || saving) return;
    setErrorText("");

    try {
      setSaving(true);
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

      if (response.status === 401) {
        setIsLoggedIn(hasLocalAuthState());
        setErrorText(hasLocalAuthState() ? "\u767b\u5f55\u5df2\u6210\u529f\uff0c\u4f46\u670d\u52a1\u5668\u8fd8\u6ca1\u8bfb\u5230\u8d26\u53f7\u72b6\u6001\uff0c\u8bf7\u9000\u51fa\u540e\u91cd\u65b0\u767b\u5f55\u4e00\u6b21\u3002" : "\u767b\u5f55\u540e\u53ef\u4ee5\u6536\u85cf\u3002");
        return;
      }

      if (!response.ok || !result.ok) throw new Error(result.message ?? "Save favorite failed");

      setIsLoggedIn(true);
      setIsFavorite(Boolean(result.isFavorite));
    } catch {
      setErrorText("\u4fdd\u5b58\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002");
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
      {errorText ? <p className="mt-1 text-xs text-rose-600">{errorText}</p> : null}
      {!isLoggedIn && !loading ? (
        <Link href={`/login?next=${encodeURIComponent(pathname || "/")}`} className="mt-1 inline-flex text-xs text-emerald-700 hover:underline">
          {"\u767b\u5f55\u540e\u6536\u85cf"}
        </Link>
      ) : null}
    </div>
  );
}
