"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ExternalLink, Search } from "lucide-react";
import type { FeedbackItem, FeedbackStatus, FeedbackType } from "@/features/feedback/types";
import { feedbackStatusLabels, feedbackTypeLabels } from "@/features/feedback/types";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { createClient } from "@/lib/supabase/client";

type FeedbackResponse = {
  ok?: boolean;
  items?: FeedbackItem[];
  message?: string;
};

const inputClass = "h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500";
const statusOptions: Array<FeedbackStatus | ""> = ["pending", "in_progress", "resolved", ""];
const typeOptions: Array<FeedbackType | ""> = ["bug", "place_error", "feature", "experience", "other", ""];

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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function statusClass(status: FeedbackStatus) {
  if (status === "resolved") return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  if (status === "in_progress") return "bg-sky-50 text-sky-700 ring-sky-100";
  return "bg-amber-50 text-amber-700 ring-amber-100";
}

export function FeedbackAdminClient() {
  const currentUser = useCurrentUser();
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<FeedbackStatus | "pending" | "in_progress" | "resolved" | "">("pending");
  const [type, setType] = useState<FeedbackType | "">("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (status) params.set("status", status);
    if (type) params.set("type", type);
    return params.toString();
  }, [q, status, type]);

  async function loadFeedback() {
    if (currentUser.isLoading) return;
    if (!currentUser.isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/feedback?${queryString}`, {
        headers: await authHeaders(""),
        credentials: "include",
        cache: "no-store"
      });
      const result = (await response.json()) as FeedbackResponse;
      if (!response.ok || !result.ok) throw new Error(result.message ?? "读取反馈失败。");
      setItems(result.items ?? []);
    } catch (err) {
      setItems([]);
      setError(err instanceof Error ? err.message : "读取反馈失败。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadFeedback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.isAuthenticated, currentUser.isLoading, queryString]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadFeedback();
  }

  async function updateStatus(item: FeedbackItem, nextStatus: FeedbackStatus) {
    setBusyId(item.id);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/admin/feedback", {
        method: "PATCH",
        headers: await authHeaders(),
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({ id: item.id, status: nextStatus, adminNote: item.adminNote ?? "" })
      });
      const result = (await response.json()) as FeedbackResponse;
      if (!response.ok || !result.ok) throw new Error(result.message ?? "更新失败。");
      setMessage(result.message ?? "反馈状态已更新。");
      setItems((values) => values.map((value) => (value.id === item.id ? { ...value, status: nextStatus } : value)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新失败。");
    } finally {
      setBusyId("");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <h1 className="text-2xl font-bold text-slate-900">反馈管理</h1>
        <p className="mt-2 text-sm text-slate-600">查看用户提交的程序问题、地点错误、功能建议和体验问题。</p>

        {!currentUser.isLoading && !currentUser.isAuthenticated ? (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700">请先登录管理员账号。</div>
        ) : null}

        <form onSubmit={handleSearch} className="mt-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_160px_180px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="搜索内容、联系方式、页面 URL" className={`${inputClass} w-full pl-9`} />
          </div>
          <select value={status} onChange={(event) => setStatus(event.target.value as FeedbackStatus | "")} className={inputClass}>
            {statusOptions.map((option) => (
              <option key={option || "all"} value={option}>
                {option ? feedbackStatusLabels[option] : "全部状态"}
              </option>
            ))}
          </select>
          <select value={type} onChange={(event) => setType(event.target.value as FeedbackType | "")} className={inputClass}>
            {typeOptions.map((option) => (
              <option key={option || "all"} value={option}>
                {option ? feedbackTypeLabels[option] : "全部类型"}
              </option>
            ))}
          </select>
          <button className="h-11 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white">筛选</button>
        </form>

        {message ? <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
        {error ? <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

        <div className="mt-5 space-y-4">
          {loading ? <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">正在读取反馈...</div> : null}
          {!loading && items.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">暂无符合条件的反馈。</div> : null}
          {items.map((item) => (
            <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{feedbackTypeLabels[item.type]}</span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusClass(item.status)}`}>
                      {feedbackStatusLabels[item.status]}
                    </span>
                    <span className="text-xs text-slate-400">{formatDate(item.createdAt)}</span>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-800">{item.content}</p>
                </div>
                <select
                  value={item.status}
                  disabled={busyId === item.id}
                  onChange={(event) => void updateStatus(item, event.target.value as FeedbackStatus)}
                  className="h-10 rounded-xl border border-slate-200 px-3 text-sm disabled:opacity-60"
                >
                  <option value="pending">待处理</option>
                  <option value="in_progress">处理中</option>
                  <option value="resolved">已解决</option>
                </select>
              </div>

              <div className="mt-4 grid gap-2 text-xs text-slate-500 md:grid-cols-2">
                {item.contact ? <p>联系方式：{item.contact}</p> : <p>联系方式：未填写</p>}
                {item.deviceType ? <p>设备：{item.deviceType}</p> : <p>设备：未记录</p>}
                {item.pageUrl ? (
                  <a href={item.pageUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-w-0 items-center gap-1 text-emerald-700 hover:underline md:col-span-2">
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{item.pageUrl}</span>
                  </a>
                ) : null}
                {item.userAgent ? <p className="truncate md:col-span-2">浏览器信息：{item.userAgent}</p> : null}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
