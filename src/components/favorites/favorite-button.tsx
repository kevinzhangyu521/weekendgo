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
};

export function FavoriteButton({ destinationId, size = "md", className = "" }: Props) {
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
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
        setErrorText("Unable to load favorite status.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [destinationId, supabase]);

  async function toggleFavorite() {
    if (loading || saving) return;
    setErrorText("");

    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        setIsLoggedIn(false);
        setErrorText("Please sign in to save favorites.");
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
      setErrorText("Save failed. Please try again.");
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
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        title={isFavorite ? "Remove from favorites" : "Add to favorites"}
        className={`${buttonSize} inline-flex items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 ${
          isFavorite ? "text-rose-600" : ""
        }`}
      >
        <Heart className={`${iconSize} ${isFavorite ? "fill-current" : ""}`} />
      </button>
      {errorText ? <p className="mt-1 text-xs text-rose-600">{errorText}</p> : null}
      {!isLoggedIn && !loading ? (
        <Link href={`/login?next=${encodeURIComponent(pathname || "/")}`} className="mt-1 inline-flex text-xs text-emerald-700 hover:underline">
          Sign in to save
        </Link>
      ) : null}
    </div>
  );
}
