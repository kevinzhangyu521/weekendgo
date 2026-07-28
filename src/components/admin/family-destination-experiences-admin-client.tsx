"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import {
  familyDestinationExperienceAgeLabels,
  familyDestinationExperienceStatusLabels,
  familyDestinationExperienceStatusOptions,
  type FamilyDestinationExperience,
  type FamilyDestinationExperienceStatus
} from "@/features/family-destination-experiences/types";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { createClient } from "@/lib/supabase/client";

type ApiResponse = {
  ok?: boolean;
  items?: FamilyDestinationExperience[];
  item?: FamilyDestinationExperience;
  message?: string;
};

const inputClass = "h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500";
const statusOptions: Array<FamilyDestinationExperienceStatus | ""> = ["pending", "approved", "rejected", ""];

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

function formatDate(value: string | null) {
  if (!value) return "未填写";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: value.includes("T") ? "2-digit" : undefined,
    minute: value.includes("T") ? "2-digit" : undefined
  }).format(new Date(value));
}

function statusClass(status: FamilyDestinationExperienceStatus) {
  if (status === "approved") return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  if (status === "rejected") return "bg-slate-100 text-slate-600 ring-slate-200";
  return "bg-amber-50 text-amber-700 ring-amber-100";
}

export function FamilyDestinationExperiencesAdminClient() {
  const currentUser = useCurrentUser();
  const [items, setItems] = useState<FamilyDestinationExperience[]>([]);
  const [status, setStatus] = useState<FamilyDestinationExperienceStatus | "">("pending");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [statusDrafts, setStatusDrafts] = useState<Record<string, FamilyDestinationExperienceStatus>>({});

  const filteredItems = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter((item) =>
      [
        item.destinationNameZh ?? "",
        item.destinationName ?? "",
        item.userId,
        item.recommendation,
        item.tip,
        item.childAgeGroup
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [items, q]);

  async function loadItems() {
    if (currentUser.isLoading) return;
    if (!currentUser.hasUser) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (status) params.set("status", status);

    try {
      const response = await fetch(`/api/admin/family-destination-experiences?${params.toString()}`, {
        headers: await authHeaders(""),
        credentials: "include",
        cache: "no-store"
      });
      const result = (await response.json()) as ApiResponse;
      if (!response.ok || !result.ok) throw new Error(result.message ?? "读取体验失败。");
      const nextItems = result.items ?? [];
      setItems(nextItems);
      setStatusDrafts(Object.fromEntries(nextItems.map((item) => [item.id, item.status])));
    } catch (err) {
      setItems([]);
      setError(err instanceof Error ? err.message : "读取体验失败。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.hasUser, currentUser.isLoading, status]);

  async function saveItem(item: FamilyDestinationExperience) {
    setBusyId(item.id);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/admin/family-destination-experiences", {
        method: "PATCH",
        headers: await authHeaders(),
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({
          id: item.id,
          status: statusDrafts[item.id] ?? item.status
        })
      });
      const result = (await response.json()) as ApiResponse;
      if (!response.ok || !result.ok || !result.item) throw new Error(result.message ?? "保存失败。");
      const saved = result.item;
      setItems((values) => values.map((value) => (value.id === saved.id ? saved : value)));
      setStatusDrafts((values) => ({ ...values, [saved.id]: saved.status }));
      setMessage(result.message ?? "审核结果已保存。");
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败。");
    } finally {
      setBusyId("");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="qmd-container py-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">体验审核</h1>
            <p className="mt-2 text-sm text-slate-600">审核用户提交的真实家庭体验。通过后，每个目的地最多展示最近 3 条。</p>
          </div>
          <button onClick={() => void loadItems()} className="interactive-button inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <RefreshCw className="h-4 w-4" />
            刷新
          </button>
        </div>

        {!currentUser.isLoading && !currentUser.hasUser ? (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700">请先登录管理员账号。</div>
        ) : null}

        <div className="mt-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_180px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="搜索目的地、用户 ID、推荐或提醒" className={`${inputClass} w-full pl-9`} />
          </div>
          <select value={status} onChange={(event) => setStatus(event.target.value as FamilyDestinationExperienceStatus | "")} className={inputClass}>
            {statusOptions.map((option) => (
              <option key={option || "all"} value={option}>
                {option ? familyDestinationExperienceStatusLabels[option] : "全部状态"}
              </option>
            ))}
          </select>
        </div>

        {message ? <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
        {error ? <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

        <div className="mt-5 space-y-4">
          {loading ? <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">正在读取体验...</div> : null}
          {!loading && currentUser.hasUser && filteredItems.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">暂无符合条件的体验。</div> : null}
          {filteredItems.map((item) => {
            const statusDraft = statusDrafts[item.id] ?? item.status;
            return (
              <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${statusClass(item.status)}`}>{familyDestinationExperienceStatusLabels[item.status]}</span>
                      <span className="text-xs text-slate-400">提交：{formatDate(item.createdAt)}</span>
                    </div>
                    <h2 className="mt-3 text-lg font-bold text-slate-950">{item.destinationNameZh || item.destinationName || "目的地"}</h2>
                    <p className="mt-1 text-sm text-slate-600">用户 ID：{item.userId}</p>
                  </div>
                  <select value={statusDraft} onChange={(event) => setStatusDrafts((values) => ({ ...values, [item.id]: event.target.value as FamilyDestinationExperienceStatus }))} className="h-10 rounded-xl border border-slate-200 px-3 text-sm">
                    {familyDestinationExperienceStatusOptions.map((option) => (
                      <option key={option} value={option}>
                        {familyDestinationExperienceStatusLabels[option]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-4 grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 md:grid-cols-2">
                  <p>
                    <span className="font-bold text-slate-900">孩子年龄：</span>
                    {familyDestinationExperienceAgeLabels[item.childAgeGroup]}
                  </p>
                  <p>
                    <span className="font-bold text-slate-900">出行日期：</span>
                    {formatDate(item.visitedAt)}
                  </p>
                  <p className="md:col-span-2">
                    <span className="font-bold text-emerald-700">推荐：</span>
                    {item.recommendation}
                  </p>
                  <p className="md:col-span-2">
                    <span className="font-bold text-amber-700">提醒：</span>
                    {item.tip}
                  </p>
                </div>

                <div className="mt-4 flex justify-end">
                  <button type="button" disabled={busyId === item.id} onClick={() => void saveItem(item)} className="interactive-button h-10 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60">
                    {busyId === item.id ? "保存中..." : "保存审核结果"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
