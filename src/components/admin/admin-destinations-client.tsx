"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff, Pencil } from "lucide-react";
import { DestinationImage } from "@/components/destinations/destination-image";
import type { AdminDestination } from "@/features/admin/destinations";
import { getDestinationImage } from "@/features/destinations/images";
import { destinationScenario } from "@/features/destinations/presenter";
import { toChineseRegionName } from "@/lib/geo/region-names";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/auth/use-current-user";

type AdminDestinationsResponse = {
  ok?: boolean;
  isAdmin?: boolean;
  destinations?: AdminDestination[];
  message?: string;
};

type AdminDestinationStatusResponse = {
  ok?: boolean;
  message?: string;
};

async function authHeaders() {
  const supabase = createClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();
  const headers: Record<string, string> = {};
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
  return headers;
}

function formatDistance(distanceKm: number) {
  if (!distanceKm || distanceKm <= 0) return "\u8ddd\u79bb\u5f85\u8ba1\u7b97";
  return `${distanceKm}km`;
}

function formatRegion(item: { province?: string | null; provinceZh?: string | null; city: string; cityZh?: string | null }) {
  const province = item.provinceZh || toChineseRegionName(item.province);
  const city = item.cityZh || toChineseRegionName(item.city);
  if (!province || province === city) return city;
  return `${province} ${city}`;
}

export function AdminDestinationsClient() {
  const currentUser = useCurrentUser();
  const [q, setQ] = useState("");
  const [destinations, setDestinations] = useState<AdminDestination[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  async function loadDestinations(nextQ = q) {
    if (currentUser.isLoading) return;
    if (!currentUser.isAuthenticated) {
      setLoading(false);
      setIsAdmin(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/destinations?q=${encodeURIComponent(nextQ)}`, {
        headers: await authHeaders(),
        credentials: "include",
        cache: "no-store"
      });
      const result = (await response.json()) as AdminDestinationsResponse;
      setIsAdmin(Boolean(result.isAdmin));
      if (!response.ok || !result.ok) throw new Error(result.message ?? "\u8bfb\u53d6\u76ee\u7684\u5730\u5931\u8d25\u3002");
      setDestinations(result.destinations ?? []);
    } catch (err) {
      setDestinations([]);
      setError(err instanceof Error ? err.message : "\u8bfb\u53d6\u76ee\u7684\u5730\u5931\u8d25\u3002");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDestinations("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.isAuthenticated, currentUser.isLoading]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadDestinations(q);
  }

  async function toggleDestinationStatus(item: AdminDestination) {
    const nextIsActive = !item.isActive;
    const confirmMessage = nextIsActive
      ? `确认恢复「${item.nameZh || item.name}」吗？恢复后会重新出现在前台。`
      : `确认下架「${item.nameZh || item.name}」吗？下架后前台列表、首页和 TOP10 都不再展示。`;

    if (!window.confirm(confirmMessage)) return;

    setUpdatingId(item.id);
    setStatusMessage("");
    setError("");
    try {
      const response = await fetch(`/api/admin/destinations/${item.id}`, {
        method: "PATCH",
        headers: {
          ...(await authHeaders()),
          "Content-Type": "application/json"
        },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({ isActive: nextIsActive })
      });
      const result = (await response.json()) as AdminDestinationStatusResponse;
      if (!response.ok || !result.ok) throw new Error(result.message ?? "\u64cd\u4f5c\u5931\u8d25\u3002");

      setDestinations((items) => items.map((value) => (value.id === item.id ? { ...value, isActive: nextIsActive } : value)));
      setStatusMessage(result.message ?? (nextIsActive ? "\u5df2\u6062\u590d\u5c55\u793a\u3002" : "\u5df2\u4e0b\u67b6\u3002"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "\u64cd\u4f5c\u5931\u8d25\u3002");
    } finally {
      setUpdatingId("");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="qmd-container py-6">
        <h1 className="text-2xl font-bold text-slate-900">{"\u76ee\u7684\u5730\u7ba1\u7406"}</h1>
        <p className="mt-2 text-sm text-slate-600">{"\u7ba1\u7406\u5168\u7ad9\u5df2\u53d1\u5e03\u7684\u76ee\u7684\u5730\u8d44\u6599\u3002"}</p>

        {loading ? <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">{"\u6b63\u5728\u8bfb\u53d6..."}</div> : null}
        {!loading && !currentUser.isAuthenticated ? (
          <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5">
            <p className="font-semibold text-slate-900">{"\u8bf7\u5148\u767b\u5f55"}</p>
            <Link href="/login?next=/admin/destinations" className="mt-4 inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">{"\u53bb\u767b\u5f55"}</Link>
          </div>
        ) : null}
        {!loading && currentUser.isAuthenticated && !isAdmin ? (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900">{error || "\u4f60\u6ca1\u6709\u7ba1\u7406\u5458\u6743\u9650\u3002"}</div>
        ) : null}
        {isAdmin ? (
          <>
            <form onSubmit={handleSearch} className="mt-5 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-4">
              <input value={q} onChange={(event) => setQ(event.target.value)} placeholder={"\u641c\u7d22\u5730\u70b9\u540d\u79f0\u6216\u57ce\u5e02"} className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">{"\u641c\u7d22"}</button>
              <button type="button" onClick={() => { setQ(""); void loadDestinations(""); }} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700">{"\u91cd\u7f6e"}</button>
            </form>
            {statusMessage ? <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{statusMessage}</div> : null}
            {error ? <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</div> : null}
            <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 py-3 text-sm text-slate-600">{"\u5171"} {destinations.length} {"\u4e2a\u76ee\u7684\u5730"}</div>
              <div className="divide-y divide-slate-100">
                {destinations.map((item) => {
                  const image = getDestinationImage(item);
                  return (
                    <article key={item.id} className="grid gap-3 p-4 md:grid-cols-[96px_1fr_auto] md:items-center">
                      <div className="relative h-20 overflow-hidden rounded-lg bg-slate-100">
                        <DestinationImage src={image.src} alt={item.nameZh || item.name} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                        {image.pending ? <span className="absolute left-1 top-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">{"\u5f85\u8865\u5145"}</span> : null}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-semibold text-slate-900">{item.nameZh || item.name}</h2>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{item.source}</span>
                          {!item.isActive ? <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">{"\u5df2\u4e0b\u67b6"}</span> : null}
                        </div>
                        <p className="mt-1 text-sm text-slate-600">{formatRegion(item)} - {destinationScenario(item, "zh")} - {formatDistance(item.distanceKm)}</p>
                        <p className="mt-1 line-clamp-1 text-sm text-slate-500">{item.descriptionZh || item.description}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 md:justify-end">
                        <Link href={`/admin/destinations/${item.id}/edit`} className="inline-flex h-10 items-center justify-center gap-1 rounded-lg border border-emerald-200 bg-white px-3 text-sm font-medium text-emerald-700">
                          <Pencil className="h-4 w-4" />{"\u7f16\u8f91"}
                        </Link>
                        <button
                          type="button"
                          disabled={updatingId === item.id}
                          onClick={() => void toggleDestinationStatus(item)}
                          className={`inline-flex h-10 items-center justify-center gap-1 rounded-lg border px-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60 ${
                            item.isActive ? "border-rose-200 bg-white text-rose-700" : "border-slate-200 bg-slate-900 text-white"
                          }`}
                        >
                          {item.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          {updatingId === item.id ? "\u5904\u7406\u4e2d" : item.isActive ? "\u4e0b\u67b6" : "\u6062\u590d"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}
