"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

type DestinationOption = {
  id: string;
  name: string;
  nameZh?: string | null;
  city?: string | null;
  cityZh?: string | null;
};

type SectionType = "today_pick" | "more_explore";

type RecommendationItem = {
  id: string;
  destinationId: string;
  destinationName: string;
  destinationCity: string;
  sectionType: SectionType;
  sortOrder: number;
  isActive: boolean;
  startAt: string | null;
  endAt: string | null;
};

type RecommendationsResponse = {
  ok: boolean;
  isAdmin?: boolean;
  items?: RecommendationItem[];
  message?: string;
};

type DestinationsResponse = {
  ok: boolean;
  isAdmin?: boolean;
  destinations?: DestinationOption[];
  message?: string;
};

const sectionLabels: Record<SectionType, string> = {
  today_pick: "\u4eca\u65e5\u63a8\u8350",
  more_explore: "\u66f4\u591a\u63a2\u7d22"
};

function fromInputDateTime(value: string) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

export function HomeRecommendationsAdminClient() {
  const [items, setItems] = useState<RecommendationItem[]>([]);
  const [destinations, setDestinations] = useState<DestinationOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    destinationId: "",
    sectionType: "today_pick" as SectionType,
    sortOrder: "100",
    isActive: true,
    startAt: "",
    endAt: ""
  });

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.sectionType.localeCompare(b.sectionType) || a.sortOrder - b.sortOrder),
    [items]
  );

  async function loadData() {
    setLoading(true);
    setMessage("");
    try {
      const [recommendationsResponse, destinationsResponse] = await Promise.all([
        fetch("/api/admin/home-recommendations", { credentials: "include", cache: "no-store" }),
        fetch("/api/admin/destinations", { credentials: "include", cache: "no-store" })
      ]);
      const recommendations = (await recommendationsResponse.json()) as RecommendationsResponse;
      const destinationResult = (await destinationsResponse.json()) as DestinationsResponse;

      setIsAdmin(Boolean(recommendations.isAdmin || destinationResult.isAdmin));
      setItems(recommendations.items ?? []);
      setDestinations(destinationResult.destinations ?? []);
      if (!recommendations.ok) setMessage(recommendations.message ?? "\u8bfb\u53d6\u9996\u9875\u63a8\u8350\u5931\u8d25\u3002");
      if (!destinationResult.ok && !recommendations.message) setMessage(destinationResult.message ?? "\u8bfb\u53d6\u76ee\u7684\u5730\u5931\u8d25\u3002");
    } catch {
      setMessage("\u8bfb\u53d6\u5931\u8d25\uff0c\u8bf7\u5237\u65b0\u540e\u91cd\u8bd5\u3002");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function saveNewRecommendation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/home-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          destinationId: form.destinationId,
          sectionType: form.sectionType,
          sortOrder: Number(form.sortOrder || "100"),
          isActive: form.isActive,
          startAt: fromInputDateTime(form.startAt),
          endAt: fromInputDateTime(form.endAt)
        })
      });
      const result = (await response.json()) as RecommendationsResponse;
      if (!response.ok || !result.ok) throw new Error(result.message ?? "\u4fdd\u5b58\u5931\u8d25\u3002");
      setMessage("\u4fdd\u5b58\u6210\u529f\uff0c\u9996\u9875\u5df2\u5237\u65b0\u63a8\u8350\u7f13\u5b58\u3002");
      setForm((value) => ({ ...value, destinationId: "", sortOrder: "100", startAt: "", endAt: "" }));
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "\u4fdd\u5b58\u5931\u8d25\u3002");
    } finally {
      setSaving(false);
    }
  }

  async function updateItem(item: RecommendationItem, patch: Partial<RecommendationItem>) {
    setMessage("");
    const next = { ...item, ...patch };
    const response = await fetch("/api/admin/home-recommendations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        id: item.id,
        sectionType: next.sectionType,
        sortOrder: next.sortOrder,
        isActive: next.isActive,
        startAt: next.startAt,
        endAt: next.endAt
      })
    });
    const result = (await response.json()) as RecommendationsResponse;
    if (!response.ok || !result.ok) {
      setMessage(result.message ?? "\u66f4\u65b0\u5931\u8d25\u3002");
      return;
    }
    setMessage("\u5df2\u4fdd\u5b58\u3002");
    await loadData();
  }

  async function deleteItem(id: string) {
    if (!window.confirm("\u786e\u5b9a\u5220\u9664\u8fd9\u6761\u9996\u9875\u63a8\u8350\u5417\uff1f")) return;
    const response = await fetch(`/api/admin/home-recommendations?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include"
    });
    const result = (await response.json()) as RecommendationsResponse;
    if (!response.ok || !result.ok) {
      setMessage(result.message ?? "\u5220\u9664\u5931\u8d25\u3002");
      return;
    }
    setMessage("\u5df2\u5220\u9664\u3002");
    await loadData();
  }

  if (loading) {
    return <main className="qmd-container py-12 text-sm text-slate-600">\u6b63\u5728\u8bfb\u53d6\u9996\u9875\u63a8\u8350\u914d\u7f6e...</main>;
  }

  if (!isAdmin) {
    return (
      <main className="qmd-container py-12">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">\u8bf7\u5148\u767b\u5f55\u7ba1\u7406\u5458\u8d26\u53f7\u3002</div>
      </main>
    );
  }

  return (
    <main className="qmd-container py-10">
      <div className="mb-6">
        <p className="text-sm font-semibold text-emerald-700">\u7ba1\u7406\u540e\u53f0</p>
        <h1 className="mt-1 text-2xl font-black text-slate-950">\u9996\u9875\u63a8\u8350\u7ba1\u7406</h1>
        <p className="mt-2 text-sm text-slate-500">\u914d\u7f6e\u9996\u9875\u201c\u4eca\u65e5\u63a8\u8350\u201d\u548c\u201c\u66f4\u591a\u63a2\u7d22\u201d\u7684\u771f\u5b9e\u6570\u636e\u5e93\u5185\u5bb9\u3002</p>
      </div>

      {message ? <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">{message}</div> : null}

      <form onSubmit={saveNewRecommendation} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">\u65b0\u589e\u63a8\u8350</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-6">
          <label className="lg:col-span-2">
            <span className="text-sm font-semibold text-slate-700">\u76ee\u7684\u5730</span>
            <select value={form.destinationId} onChange={(event) => setForm((value) => ({ ...value, destinationId: event.target.value }))} required className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm">
              <option value="">\u8bf7\u9009\u62e9\u76ee\u7684\u5730</option>
              {destinations.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nameZh || item.name} {item.cityZh || item.city ? `(${item.cityZh || item.city})` : ""}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-sm font-semibold text-slate-700">\u63a8\u8350\u4f4d\u7f6e</span>
            <select value={form.sectionType} onChange={(event) => setForm((value) => ({ ...value, sectionType: event.target.value as SectionType }))} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm">
              <option value="today_pick">{sectionLabels.today_pick}</option>
              <option value="more_explore">{sectionLabels.more_explore}</option>
            </select>
          </label>
          <label>
            <span className="text-sm font-semibold text-slate-700">\u6392\u5e8f</span>
            <input value={form.sortOrder} onChange={(event) => setForm((value) => ({ ...value, sortOrder: event.target.value }))} type="number" className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" />
          </label>
          <label className="flex items-end gap-2 pb-3 text-sm font-semibold text-slate-700">
            <input checked={form.isActive} onChange={(event) => setForm((value) => ({ ...value, isActive: event.target.checked }))} type="checkbox" />
            \u542f\u7528
          </label>
          <button disabled={saving} className="h-11 self-end rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white disabled:opacity-60">
            {saving ? "\u4fdd\u5b58\u4e2d..." : "\u4fdd\u5b58\u63a8\u8350"}
          </button>
        </div>
      </form>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-[1.5fr_1fr_100px_100px_120px] gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-500">
          <span>\u76ee\u7684\u5730</span>
          <span>\u4f4d\u7f6e</span>
          <span>\u6392\u5e8f</span>
          <span>\u72b6\u6001</span>
          <span>\u64cd\u4f5c</span>
        </div>
        {sortedItems.length > 0 ? (
          sortedItems.map((item) => (
            <div key={item.id} className="grid grid-cols-[1.5fr_1fr_100px_100px_120px] items-center gap-3 border-b border-slate-100 px-4 py-3 text-sm last:border-b-0">
              <div>
                <p className="font-bold text-slate-900">{item.destinationName}</p>
                <p className="text-xs text-slate-500">{item.destinationCity}</p>
              </div>
              <select value={item.sectionType} onChange={(event) => void updateItem(item, { sectionType: event.target.value as SectionType })} className="h-10 rounded-lg border border-slate-200 px-2">
                <option value="today_pick">{sectionLabels.today_pick}</option>
                <option value="more_explore">{sectionLabels.more_explore}</option>
              </select>
              <input type="number" defaultValue={item.sortOrder} onBlur={(event) => void updateItem(item, { sortOrder: Number(event.target.value || "100") })} className="h-10 rounded-lg border border-slate-200 px-2" />
              <button type="button" onClick={() => void updateItem(item, { isActive: !item.isActive })} className={item.isActive ? "rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700" : "rounded-lg bg-slate-100 px-3 py-2 text-slate-500"}>
                {item.isActive ? "\u542f\u7528" : "\u505c\u7528"}
              </button>
              <button type="button" onClick={() => void deleteItem(item.id)} className="rounded-lg border border-rose-200 px-3 py-2 text-rose-600">
                \u5220\u9664
              </button>
            </div>
          ))
        ) : (
          <div className="px-4 py-8 text-center text-sm text-slate-500">\u6682\u65e0\u9996\u9875\u63a8\u8350\u914d\u7f6e\u3002</div>
        )}
      </div>
    </main>
  );
}
