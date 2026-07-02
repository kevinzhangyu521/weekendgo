"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

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
  recommendation?: string | null;
  customTitle?: string | null;
  customCoverImage?: string | null;
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

type AdminMeResponse = {
  ok: boolean;
  isAdmin?: boolean;
  role?: string;
  email?: string | null;
};

const sectionLabels: Record<SectionType, string> = {
  today_pick: "今日推荐",
  more_explore: "更多探索"
};

function fromInputDateTime(value: string) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

async function getAuthHeaders() {
  const supabase = createClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {};
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
  return headers;
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
      const authHeaders = await getAuthHeaders();
      const [adminResponse, recommendationsResponse, destinationsResponse] = await Promise.all([
        fetch("/api/admin/me", { headers: authHeaders, credentials: "include", cache: "no-store" }),
        fetch("/api/admin/home-recommendations", { headers: authHeaders, credentials: "include", cache: "no-store" }),
        fetch("/api/admin/destinations", { headers: authHeaders, credentials: "include", cache: "no-store" })
      ]);
      const admin = (await adminResponse.json()) as AdminMeResponse;
      const recommendations = (await recommendationsResponse.json()) as RecommendationsResponse;
      const destinationResult = (await destinationsResponse.json()) as DestinationsResponse;

      setIsAdmin(Boolean(admin.isAdmin || recommendations.isAdmin || destinationResult.isAdmin));
      setItems(recommendations.items ?? []);
      setDestinations(destinationResult.destinations ?? []);
      if (!admin.isAdmin) setMessage("请先登录管理员账号。");
      if (!recommendations.ok && admin.isAdmin) setMessage(recommendations.message ?? "读取首页推荐失败。");
      if (!destinationResult.ok && admin.isAdmin && !recommendations.message) setMessage(destinationResult.message ?? "读取目的地失败。");
    } catch {
      setMessage("读取失败，请刷新后重试。");
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
      const authHeaders = await getAuthHeaders();
      const response = await fetch("/api/admin/home-recommendations", {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
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
      if (!response.ok || !result.ok) throw new Error(result.message ?? "保存失败。");
      setMessage("保存成功，首页已刷新推荐缓存。");
      setForm((value) => ({ ...value, destinationId: "", sortOrder: "100", startAt: "", endAt: "" }));
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败。");
    } finally {
      setSaving(false);
    }
  }

  async function updateItem(item: RecommendationItem, patch: Partial<RecommendationItem>) {
    setMessage("");
    const next = { ...item, ...patch };
    const authHeaders = await getAuthHeaders();
    const response = await fetch("/api/admin/home-recommendations", {
      method: "PATCH",
      headers: { ...authHeaders, "Content-Type": "application/json" },
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
      setMessage(result.message ?? "更新失败。");
      return;
    }
    setMessage("已保存。");
    await loadData();
  }

  async function deleteItem(id: string) {
    if (!window.confirm("确定删除这条首页推荐吗？")) return;
    const authHeaders = await getAuthHeaders();
    const response = await fetch(`/api/admin/home-recommendations?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: authHeaders,
      credentials: "include"
    });
    const result = (await response.json()) as RecommendationsResponse;
    if (!response.ok || !result.ok) {
      setMessage(result.message ?? "删除失败。");
      return;
    }
    setMessage("已删除。");
    await loadData();
  }

  if (loading) {
    return <main className="qmd-container py-12 text-sm text-slate-600">正在读取首页推荐配置...</main>;
  }

  if (!isAdmin) {
    return (
      <main className="qmd-container py-12">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">请先登录管理员账号。</div>
      </main>
    );
  }

  return (
    <main className="qmd-container py-10">
      <div className="mb-6">
        <p className="text-sm font-semibold text-emerald-700">管理后台</p>
        <h1 className="mt-1 text-2xl font-black text-slate-950">首页推荐管理</h1>
        <p className="mt-2 text-sm text-slate-500">配置首页“今日推荐”和“更多探索”的真实数据库内容。</p>
      </div>

      {message ? <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">{message}</div> : null}

      <form onSubmit={saveNewRecommendation} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">新增推荐</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-6">
          <label className="lg:col-span-2">
            <span className="text-sm font-semibold text-slate-700">目的地</span>
            <select value={form.destinationId} onChange={(event) => setForm((value) => ({ ...value, destinationId: event.target.value }))} required className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm">
              <option value="">请选择目的地</option>
              {destinations.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nameZh || item.name} {item.cityZh || item.city ? `(${item.cityZh || item.city})` : ""}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-sm font-semibold text-slate-700">推荐位置</span>
            <select value={form.sectionType} onChange={(event) => setForm((value) => ({ ...value, sectionType: event.target.value as SectionType }))} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm">
              <option value="today_pick">{sectionLabels.today_pick}</option>
              <option value="more_explore">{sectionLabels.more_explore}</option>
            </select>
          </label>
          <label>
            <span className="text-sm font-semibold text-slate-700">排序</span>
            <input value={form.sortOrder} onChange={(event) => setForm((value) => ({ ...value, sortOrder: event.target.value }))} type="number" className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" />
          </label>
          <label className="flex items-end gap-2 pb-3 text-sm font-semibold text-slate-700">
            <input checked={form.isActive} onChange={(event) => setForm((value) => ({ ...value, isActive: event.target.checked }))} type="checkbox" />
            启用
          </label>
          <button disabled={saving} className="h-11 self-end rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white disabled:opacity-60">
            {saving ? "保存中..." : "保存推荐"}
          </button>
        </div>
      </form>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-[1.5fr_1fr_100px_100px_120px] gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-500">
          <span>目的地</span>
          <span>位置</span>
          <span>排序</span>
          <span>状态</span>
          <span>操作</span>
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
                {item.isActive ? "启用" : "停用"}
              </button>
              <button type="button" onClick={() => void deleteItem(item.id)} className="rounded-lg border border-rose-200 px-3 py-2 text-rose-600">
                删除
              </button>
            </div>
          ))
        ) : (
          <div className="px-4 py-8 text-center text-sm text-slate-500">暂无首页推荐配置。</div>
        )}
      </div>
    </main>
  );
}
