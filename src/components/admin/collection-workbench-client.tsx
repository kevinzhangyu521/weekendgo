"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ExternalLink, XCircle } from "lucide-react";
import type { CollectedSpot } from "@/features/collections/types";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/auth/use-current-user";

type CollectionsResponse = {
  ok?: boolean;
  items?: CollectedSpot[];
  message?: string;
};

const inputClass = "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm";
const labelClass = "block text-sm font-bold text-slate-900";

async function authHeaders(contentType = "application/json") {
  const supabase = createClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();
  const headers: Record<string, string> = {};
  if (contentType) headers["Content-Type"] = contentType;
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
  return headers;
}

function tagText(item: CollectedSpot) {
  const tags = [...item.tags];
  if (item.isFamilyFriendly && !tags.includes("亲子")) tags.push("亲子");
  if (item.canCreek && !tags.includes("溯溪")) tags.push("溯溪");
  if (item.isCamping && !tags.includes("露营")) tags.push("露营");
  if (item.isFree && !tags.includes("免费")) tags.push("免费");
  return tags;
}

export function CollectionWorkbenchClient() {
  const currentUser = useCurrentUser();
  const [items, setItems] = useState<CollectedSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ city: "", tag: "", status: "pending", family: false, creek: false, camping: false });

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.city.trim()) params.set("city", filters.city.trim());
    if (filters.tag.trim()) params.set("tag", filters.tag.trim());
    if (filters.status) params.set("status", filters.status);
    if (filters.family) params.set("family", "true");
    if (filters.creek) params.set("creek", "true");
    if (filters.camping) params.set("camping", "true");
    return params.toString();
  }, [filters]);

  async function loadItems() {
    if (currentUser.isLoading) return;
    if (!currentUser.isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/collections?${queryString}`, {
        headers: await authHeaders(""),
        credentials: "include",
        cache: "no-store"
      });
      const result = (await response.json()) as CollectionsResponse;
      if (!response.ok || !result.ok) throw new Error(result.message ?? "读取采集地点失败。");
      setItems(result.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "读取采集地点失败。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.isAuthenticated, currentUser.isLoading, queryString]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setSaving(true);
    setMessage("");
    setError("");

    const form = new FormData(formElement);
    const payload = {
      sourceUrl: String(form.get("source_url") ?? ""),
      videoUrl: String(form.get("video_url") ?? ""),
      creatorName: String(form.get("creator_name") ?? ""),
      name: String(form.get("name") ?? ""),
      city: String(form.get("city") ?? ""),
      address: String(form.get("address") ?? ""),
      latitude: String(form.get("latitude") ?? ""),
      longitude: String(form.get("longitude") ?? ""),
      recommendation: String(form.get("recommendation") ?? ""),
      suitableAge: String(form.get("suitable_age") ?? ""),
      minKidAge: String(form.get("min_kid_age") ?? "0"),
      ticketPrice: String(form.get("ticket_price") ?? ""),
      isFamilyFriendly: form.get("is_family_friendly") === "on",
      canCreek: form.get("can_creek") === "on",
      isCamping: form.get("is_camping") === "on",
      isFree: form.get("is_free") === "on",
      parkingInfo: String(form.get("parking_info") ?? ""),
      safetyTips: String(form.get("safety_tips") ?? ""),
      tags: String(form.get("tags") ?? "").split(/[,，\s]+/)
    };

    try {
      const response = await fetch("/api/admin/collections", {
        method: "POST",
        headers: await authHeaders(),
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify(payload)
      });
      const result = (await response.json()) as CollectionsResponse;
      if (!response.ok || !result.ok) throw new Error(result.message ?? "保存失败。");
      setMessage(result.message ?? "已保存。");
      formElement.reset();
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败。");
    } finally {
      setSaving(false);
    }
  }

  async function review(id: string, action: "approve" | "reject") {
    setBusyId(id);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/admin/collections", {
        method: "PATCH",
        headers: await authHeaders(),
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({ id, action })
      });
      const result = (await response.json()) as CollectionsResponse;
      if (!response.ok || !result.ok) throw new Error(result.message ?? "操作失败。");
      setMessage(result.message ?? "操作成功。");
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败。");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="qmd-container py-6">
        <h1 className="text-2xl font-bold text-slate-900">{"地点采集后台"}</h1>
        <p className="mt-2 text-sm text-slate-600">{"手动录入抖音/小红书/视频平台线索，只保存来源链接和人工填写内容，不自动爬取、不盗用视频和图片。"}</p>

        {!currentUser.isLoading && !currentUser.isAuthenticated ? (
          <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-700">{"请先登录管理员账号。"}</div>
        ) : null}

        <form onSubmit={handleCreate} className="mt-5 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <label className={labelClass}>{"来源链接 *"}<input name="source_url" required placeholder="抖音/小红书/视频链接" className={inputClass} /></label>
            <label className={labelClass}>{"视频链接"}<input name="video_url" placeholder="可与来源链接相同" className={inputClass} /></label>
            <label className={labelClass}>{"主播名称"}<input name="creator_name" placeholder="博主/主播名称" className={inputClass} /></label>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <label className={labelClass}>{"地点名称 *"}<input name="name" required className={inputClass} /></label>
            <label className={labelClass}>{"城市 *"}<input name="city" required placeholder="武汉" className={inputClass} /></label>
            <label className={labelClass}>{"地址"}<input name="address" placeholder="具体入口/停车点/地标" className={inputClass} /></label>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <label className={labelClass}>{"纬度"}<input name="latitude" type="number" step="0.000001" className={inputClass} /></label>
            <label className={labelClass}>{"经度"}<input name="longitude" type="number" step="0.000001" className={inputClass} /></label>
            <label className={labelClass}>{"适合年龄"}<input name="suitable_age" placeholder="3-6岁 / 6-12岁" className={inputClass} /></label>
            <label className={labelClass}>{"最小年龄"}<input name="min_kid_age" type="number" min="0" defaultValue="0" className={inputClass} /></label>
            <label className={labelClass}>{"门票信息"}<input name="ticket_price" placeholder="免费 / 30元 / 以景区为准" className={inputClass} /></label>
          </div>
          <label className={labelClass}>{"推荐理由 *"}<textarea name="recommendation" required rows={3} className={inputClass} /></label>
          <div className="grid gap-4 md:grid-cols-3">
            <label className={labelClass}>{"停车信息"}<input name="parking_info" placeholder="停车场/路边/收费情况" className={inputClass} /></label>
            <label className={labelClass}>{"安全提醒"}<input name="safety_tips" placeholder="水深、落石、湿滑、护栏等" className={inputClass} /></label>
            <label className={labelClass}>{"标签"}<input name="tags" placeholder="亲子, 溯溪, 露营, 免费" className={inputClass} /></label>
          </div>
          <div className="flex flex-wrap gap-4 rounded-xl bg-slate-50 p-3 text-sm font-medium text-slate-700">
            <label><input name="is_family_friendly" type="checkbox" defaultChecked className="mr-2" />{"亲子"}</label>
            <label><input name="can_creek" type="checkbox" className="mr-2" />{"可溯溪"}</label>
            <label><input name="is_camping" type="checkbox" className="mr-2" />{"露营"}</label>
            <label><input name="is_free" type="checkbox" className="mr-2" />{"免费"}</label>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button disabled={saving || !currentUser.isAuthenticated} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
              {saving ? "保存中..." : "生成待审核地点"}
            </button>
            {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          </div>
        </form>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-6">
            <input value={filters.city} onChange={(event) => setFilters((value) => ({ ...value, city: event.target.value }))} placeholder="按城市" className={inputClass} />
            <input value={filters.tag} onChange={(event) => setFilters((value) => ({ ...value, tag: event.target.value }))} placeholder="按标签" className={inputClass} />
            <select value={filters.status} onChange={(event) => setFilters((value) => ({ ...value, status: event.target.value }))} className={inputClass}>
              <option value="pending">待审核</option>
              <option value="approved">已发布</option>
              <option value="rejected">不发布</option>
              <option value="">全部</option>
            </select>
            <label className="mt-2 text-sm"><input type="checkbox" checked={filters.family} onChange={(event) => setFilters((value) => ({ ...value, family: event.target.checked }))} className="mr-2" />亲子</label>
            <label className="mt-2 text-sm"><input type="checkbox" checked={filters.creek} onChange={(event) => setFilters((value) => ({ ...value, creek: event.target.checked }))} className="mr-2" />溯溪</label>
            <label className="mt-2 text-sm"><input type="checkbox" checked={filters.camping} onChange={(event) => setFilters((value) => ({ ...value, camping: event.target.checked }))} className="mr-2" />露营</label>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {loading ? <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">{"正在读取采集地点..."}</div> : null}
          {!loading && items.length === 0 ? <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">{"暂无符合条件的采集地点。"}</div> : null}
          {items.map((item) => (
            <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500">{item.createdAt}</p>
                  <h2 className="mt-1 text-lg font-bold text-slate-900">{item.name}</h2>
                  <p className="mt-1 text-sm text-slate-600">{item.city} {item.address ? `· ${item.address}` : ""}</p>
                  {item.creatorName ? <p className="mt-1 text-xs text-slate-500">{"主播/博主："}{item.creatorName}</p> : null}
                  <p className="mt-2 text-sm leading-6 text-slate-700">{item.recommendation}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{item.status === "pending" ? "待审核" : item.status === "approved" ? "已发布" : "不发布"}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                {tagText(item).map((tag) => <span key={tag} className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">{tag}</span>)}
                {item.ticketPrice ? <span className="rounded-full bg-slate-100 px-2.5 py-1">门票：{item.ticketPrice}</span> : null}
                {item.parkingInfo ? <span className="rounded-full bg-slate-100 px-2.5 py-1">停车：{item.parkingInfo}</span> : null}
                {item.safetyTips ? <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-800">安全：{item.safetyTips}</span> : null}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
                  <ExternalLink className="h-4 w-4" />来源链接
                </a>
                {item.videoUrl ? (
                  <a href={item.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
                    <ExternalLink className="h-4 w-4" />视频链接
                  </a>
                ) : null}
                {item.status === "pending" ? (
                  <>
                    <button onClick={() => review(item.id, "approve")} disabled={busyId === item.id} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60">
                      <CheckCircle2 className="h-4 w-4" />审核通过并发布
                    </button>
                    <button onClick={() => review(item.id, "reject")} disabled={busyId === item.id} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-rose-700 disabled:opacity-60">
                      <XCircle className="h-4 w-4" />不发布
                    </button>
                  </>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
