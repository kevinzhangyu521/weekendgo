"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bath, Car, Heart, Star } from "lucide-react";
import { getDestinationImage, hasUsableDestinationImage } from "@/features/destinations/images";
import { destinationName, destinationRegion, destinationScenario } from "@/features/destinations/presenter";
import type { DestinationItem } from "@/features/destinations/types";
import { DEFAULT_HOME_CITY, withDistanceFromCity } from "@/lib/geo/distance";
import type { Locale } from "@/lib/i18n/config";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { createClient } from "@/lib/supabase/client";

type FavoritesResponse = {
  ok?: boolean;
  destinations?: DestinationItem[];
  message?: string;
};

function pick<T>(locale: Locale, en: T, zh: T): T {
  return locale === "zh" ? zh : en;
}

function formatDistance(distanceKm: number, locale: Locale) {
  if (!distanceKm || distanceKm <= 0) return pick(locale, "Distance pending", "\u8ddd\u79bb\u5f85\u8ba1\u7b97");
  return pick(locale, `About ${distanceKm}km away`, `\u7ea6 ${distanceKm}km`);
}

async function authHeaders() {
  const supabase = createClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();
  const headers: Record<string, string> = {};
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
  return headers;
}

export function FavoritesClient({ locale }: { locale: Locale }) {
  const currentUser = useCurrentUser();
  const [destinations, setDestinations] = useState<DestinationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function loadFavorites() {
      if (currentUser.isLoading) return;
      if (!currentUser.isAuthenticated) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/favorites/mine", { headers: await authHeaders(), credentials: "include", cache: "no-store" });
        const result = (await response.json()) as FavoritesResponse;
        if (!response.ok || !result.ok) throw new Error(result.message ?? "\u8bfb\u53d6\u6536\u85cf\u5931\u8d25\u3002");
        if (mounted) setDestinations(result.destinations ?? []);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "\u8bfb\u53d6\u6536\u85cf\u5931\u8d25\u3002");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void loadFavorites();
    return () => {
      mounted = false;
    };
  }, [currentUser.isAuthenticated, currentUser.isLoading]);

  const list = withDistanceFromCity(destinations, DEFAULT_HOME_CITY).filter(hasUsableDestinationImage);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <div className="mb-5">
          <h1 className="inline-flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Heart className="h-6 w-6 text-rose-600" />
            {pick(locale, "My Favorites", "\u6211\u7684\u6536\u85cf")}
          </h1>
        </div>
        {loading ? <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-700">{pick(locale, "Loading favorites...", "\u6b63\u5728\u8bfb\u53d6\u6536\u85cf...")}</div> : null}
        {!loading && !currentUser.isAuthenticated ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-700">
            <p className="font-medium">{pick(locale, "Please sign in to view favorites.", "\u8bf7\u5148\u767b\u5f55\uff0c\u7136\u540e\u67e5\u770b\u6536\u85cf\u3002")}</p>
            <Link href="/login?next=/favorites" className="interactive-button mt-4 inline-flex rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
              {pick(locale, "Sign in", "\u53bb\u767b\u5f55")}
            </Link>
          </div>
        ) : null}
        {error ? <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">{error}</div> : null}
        {!loading && currentUser.isAuthenticated && list.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-700">
            <p className="font-medium">{pick(locale, "No favorites yet.", "\u8fd8\u6ca1\u6709\u6536\u85cf\u3002")}</p>
            <p className="mt-1 text-sm text-slate-600">{pick(locale, "Save places from the destination list or detail page.", "\u53ef\u5728\u5217\u8868\u9875\u6216\u8be6\u60c5\u9875\u6536\u85cf\u76ee\u7684\u5730\u3002")}</p>
            <Link href="/destinations" className="interactive-button mt-4 inline-flex rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
              {pick(locale, "Explore destinations", "\u53bb\u770b\u76ee\u7684\u5730")}
            </Link>
          </div>
        ) : null}
        {list.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {list.map((item) => {
              const image = getDestinationImage(item);
              return (
                <Link key={item.id} href={`/destinations/${item.id}`} className="interactive-card group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="relative h-44 overflow-hidden bg-slate-100">
                    <img src={image.src} alt={destinationName(item, locale)} loading="lazy" decoding="async" className="interactive-image h-full w-full object-cover" />
                  </div>
                  <div className="flex flex-1 flex-col space-y-3 p-4">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">{destinationScenario(item, locale)}</span>
                      <span className="inline-flex items-center gap-1 text-xs text-slate-600"><Star className="h-3.5 w-3.5 fill-current text-amber-500" />{item.rating.toFixed(1)}</span>
                    </div>
                    <h2 className="text-base font-semibold text-slate-900">{destinationName(item, locale)}</h2>
                    <p className="text-sm text-slate-600">{destinationRegion(item, locale)} - {formatDistance(item.distanceKm, locale)}</p>
                    <div className="mt-auto flex items-center gap-4 border-t border-slate-100 pt-3 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1"><Car className="h-3.5 w-3.5" />{item.hasParking ? "\u53ef\u505c\u8f66" : "\u505c\u8f66\u4e00\u822c"}</span>
                      <span className="inline-flex items-center gap-1"><Bath className="h-3.5 w-3.5" />{item.hasToilet ? "\u6709\u5395\u6240" : "\u5395\u6240\u8f83\u5c11"}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : null}
      </section>
    </main>
  );
}
