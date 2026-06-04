"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  destinationId: string;
  size?: "sm" | "md";
  className?: string;
  initialIsFavorite?: boolean;
  initialIsLoggedIn?: boolean;
};

export function FavoriteButton({
  destinationId,
  size = "md",
  className = "",
  initialIsFavorite,
  initialIsLoggedIn
}: Props) {
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);
  const hasInitialState = typeof initialIsFavorite === "boolean" || typeof initialIsLoggedIn === "boolean";
  const [loading, setLoading] = useState(!hasInitialState);
  const [saving, setSaving] = useState(false);
  const [isFavorite, setIsFavorite] = useState(Boolean(initialIsFavorite));
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(initialIsLoggedIn));
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    if (hasInitialState) return;

    let mounted = true;

    async function load() {
      try {
        const {
          data: { user }
        } = await supabase.auth.getUser();
        if (!mounted) return;

        if (!user) {
          setIsLoggedIn(false);
          setIsFavorite(false);
          setLoading(false);
          return;
        }

        setIsLoggedIn(true);
        const { data } = await supabase
          .from("favorites")
          .select("id")
          .eq("user_id", user.id)
          .eq("destination_id", destinationId)
          .maybeSingle();

        if (!mounted) return;
        setIsFavorite(Boolean(data));
      } catch {
        if (!mounted) return;
        setErrorText("\u6536\u85cf\u72b6\u6001\u52a0\u8f7d\u5931\u8d25\u3002");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [destinationId, hasInitialState, supabase]);

  async function toggleFavorite() {
    if (loading || saving) return;
    setErrorText("");

    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        setIsLoggedIn(false);
        setErrorText("\u8bf7\u5148\u767b\u5f55\u518d\u6536\u85cf\u3002");
        return;
      }

      setIsLoggedIn(true);
      setSaving(true);

      if (isFavorite) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("destination_id", destinationId);
        if (error) throw error;
        setIsFavorite(false);
      } else {
        const { error } = await supabase.from("favorites").insert({
          user_id: user.id,
          destination_id: destinationId
        });
        if (error) throw error;
        setIsFavorite(true);
      }
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
