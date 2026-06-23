"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ExternalLink, Search, TrendingUp } from "lucide-react";
import type { FeedbackItem, FeedbackStatus, FeedbackType } from "@/features/feedback/types";
import { feedbackStatusLabels, feedbackStatusOptions, feedbackTypeLabels } from "@/features/feedback/types";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { createClient } from "@/lib/supabase/client";

type FeedbackResponse = {
  ok?: boolean;
  items?: FeedbackItem[];
  item?: FeedbackItem;
  deletedId?: string;
  message?: string;
};

type ItemMessage = {
  type: "loading" | "success" | "error";
  text: string;
};

const inputClass = "h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500";
const statusOptions: Array<FeedbackStatus | ""> = [...feedbackStatusOptions, ""];
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

async function readJsonResponse<T extends { message?: string }>(response: Response): Promise<T> {
  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    const fallback = response.status === 404 ? "保存接口不存在，请确认新版代码已部署。" : "接口返回异常，请稍后再试。";
    return { message: fallback } as T;
  }
}

function formatDate(value: string | null) {
  if (!value) return "暂无记录";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function statusClass(status: FeedbackStatus) {
  if (status === "completed") return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  if (status === "accepted") return "bg-teal-50 text-teal-700 ring-teal-100";
  if (status === "rejected") return "bg-slate-100 text-slate-600 ring-slate-200";
  if (status === "in_progress") return "bg-sky-50 text-sky-700 ring-sky-100";
  return "bg-amber-50 text-amber-700 ring-amber-100";
}

function itemMessageClass(type: ItemMessage["type"]) {
  if (type === "success") return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  if (type === "error") return "bg-rose-50 text-rose-700 ring-rose-100";
  return "bg-slate-50 text-slate-600 ring-slate-200";
}

function isSameLocalDay(date: Date, now: Date) {
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

function isWithinLastDays(date: Date, now: Date, days: number) {
  const start = new Date(now);
  start.setDate(start.getDate() - days + 1);
  start.setHours(0, 0, 0, 0);
  return date >= start;
}

function sortTypeCounts(items: FeedbackItem[]) {
  const counts = new Map<FeedbackType, number>();
  items.forEach((item) => counts.set(item.type, (counts.get(item.type) ?? 0) + 1));
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
}

function priorityQueue(items: FeedbackItem[]) {
  return items
    .filter((item) => (item.status === "pending" || item.status === "in_progress") && (item.type === "bug" || item.type === "place_error"))
    .slice(0, 5);
}

function MetricCard({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

export function FeedbackAdminClient() {
  const currentUser = useCurrentUser();
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [summaryItems, setSummaryItems] = useState<FeedbackItem[]>([]);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [statusDrafts, setStatusDrafts] = useState<Record<string, FeedbackStatus>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<FeedbackStatus | "">("pending");
  const [type, setType] = useState<FeedbackType | "">("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [itemMessages, setItemMessages] = useState<Record<string, ItemMessage>>({});

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (status) params.set("status", status);
    if (type) params.set("type", type);
    return params.toString();
  }, [q, status, type]);

  const summary = useMemo(() => {
    const now = new Date();
    const todayCount = summaryItems.filter((item) => isSameLocalDay(new Date(item.createdAt), now)).length;
    const last7DaysCount = summaryItems.filter((item) => isWithinLastDays(new Date(item.createdAt), now, 7)).length;
    const pendingCount = summaryItems.filter((item) => item.status === "pending").length;
    const inProgressCount = summaryItems.filter((item) => item.status === "in_progress").length;
    const completedCount = summaryItems.filter((item) => item.status === "completed").length;
    const typeCounts = sortTypeCounts(summaryItems);
    const priorityItems = priorityQueue(summaryItems);

    return {
      todayCount,
      last7DaysCount,
      pendingCount,
      inProgressCount,
      completedCount,
      typeCounts,
      priorityItems
    };
  }, [summaryItems]);

  async function loadFeedback() {
    if (currentUser.isLoading) return;
    if (!currentUser.isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const [filteredResponse, summaryResponse] = await Promise.all([
        fetch(`/api/admin/feedback?${queryString}`, {
          headers: await authHeaders(""),
          credentials: "include",
          cache: "no-store"
        }),
        fetch("/api/admin/feedback", {
          headers: await authHeaders(""),
          credentials: "include",
          cache: "no-store"
        })
      ]);

      const filteredResult = await readJsonResponse<FeedbackResponse>(filteredResponse);
      const summaryResult = await readJsonResponse<FeedbackResponse>(summaryResponse);
      if (!filteredResponse.ok || !filteredResult.ok) throw new Error(filteredResult.message ?? "读取反馈失败。");
      if (!summaryResponse.ok || !summaryResult.ok) throw new Error(summaryResult.message ?? "读取反馈统计失败。");

      const nextItems = filteredResult.items ?? [];
      setItems(nextItems);
      setSummaryItems(summaryResult.items ?? []);
      setReplyDrafts(Object.fromEntries(nextItems.map((item) => [item.id, item.adminReply ?? ""])));
      setStatusDrafts(Object.fromEntries(nextItems.map((item) => [item.id, item.status])));
    } catch (err) {
      setItems([]);
      setSummaryItems([]);
      setReplyDrafts({});
      setStatusDrafts({});
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

  async function updateFeedback(item: FeedbackItem, nextStatus: FeedbackStatus) {
    setBusyId(item.id);
    setMessage("");
    setError("");
    setItemMessages((values) => ({
      ...values,
      [item.id]: { type: "loading", text: "正在保存..." }
    }));
    try {
      const response = await fetch(`/api/admin/feedback/${item.id}`, {
        method: "PATCH",
        headers: await authHeaders(),
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({
          status: nextStatus,
          adminNote: item.adminNote ?? "",
          adminReply: replyDrafts[item.id] ?? ""
        })
      });
      const result = await readJsonResponse<FeedbackResponse>(response);
      if (!response.ok || !result.ok) throw new Error(result.message ?? "更新失败。");
      if (!result.item) throw new Error("保存失败：接口没有返回数据库记录。");
      const savedItem = result.item;

      setMessage(result.message ?? "反馈已更新。");
      setItemMessages((values) => ({
        ...values,
        [item.id]: { type: "success", text: "已保存回复。" }
      }));
      setItems((values) =>
        values.map((value) => (value.id === savedItem.id ? savedItem : value))
      );
      setSummaryItems((values) =>
        values.map((value) => (value.id === savedItem.id ? savedItem : value))
      );
      setReplyDrafts((values) => ({ ...values, [savedItem.id]: savedItem.adminReply ?? "" }));
      setStatusDrafts((values) => ({ ...values, [savedItem.id]: savedItem.status }));
    } catch (err) {
      const detail = err instanceof Error ? err.message : "更新失败。";
      setError(detail);
      setItemMessages((values) => ({
        ...values,
        [item.id]: { type: "error", text: detail }
      }));
    } finally {
      setBusyId("");
    }
  }

  async function deleteFeedback(item: FeedbackItem) {
    const ok = window.confirm("确定删除这条反馈吗？删除后不可恢复。");
    if (!ok) return;

    setBusyId(item.id);
    setMessage("");
    setError("");
    setItemMessages((values) => ({
      ...values,
      [item.id]: { type: "loading", text: "正在删除..." }
    }));

    try {
      const response = await fetch(`/api/admin/feedback/${item.id}`, {
        method: "DELETE",
        headers: await authHeaders(),
        credentials: "include",
        cache: "no-store"
      });
      const result = await readJsonResponse<FeedbackResponse>(response);
      if (!response.ok || !result.ok) throw new Error(result.message ?? "删除失败。");

      setMessage(result.message ?? "反馈已删除。");
      setItems((values) => values.filter((value) => value.id !== item.id));
      setSummaryItems((values) => values.filter((value) => value.id !== item.id));
      setReplyDrafts((values) => {
        const next = { ...values };
        delete next[item.id];
        return next;
      });
      setStatusDrafts((values) => {
        const next = { ...values };
        delete next[item.id];
        return next;
      });
      setItemMessages((values) => {
        const next = { ...values };
        delete next[item.id];
        return next;
      });
    } catch (err) {
      const detail = err instanceof Error ? err.message : "删除失败。";
      setError(detail);
      setItemMessages((values) => ({
        ...values,
        [item.id]: { type: "error", text: detail }
      }));
    } finally {
      setBusyId("");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">反馈管理</h1>
            <p className="mt-2 text-sm text-slate-600">查看用户提交的问题、建议，并回复处理进度。</p>
          </div>
          <button onClick={() => void loadFeedback()} className="interactive-button h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            刷新数据
          </button>
        </div>

        {!currentUser.isLoading && !currentUser.isAuthenticated ? (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700">请先登录管理员账号。</div>
        ) : null}

        {currentUser.isAuthenticated ? (
          <>
            <section className="mt-5">
              <div className="mb-3 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-slate-900">反馈处理面板</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <MetricCard label="今日反馈" value={summary.todayCount} hint="当天新增反馈" />
                <MetricCard label="待处理" value={summary.pendingCount} hint="需要尽快查看" />
                <MetricCard label="处理中" value={summary.inProgressCount} hint="已经进入处理" />
                <MetricCard label="近 7 天" value={summary.last7DaysCount} hint="种子测试热度" />
                <MetricCard label="已完成" value={summary.completedCount} hint="已经关闭的问题" />
              </div>

              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <h3 className="font-bold text-slate-900">优先处理队列</h3>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">程序问题和地点信息错误会优先显示在这里。</p>
                  <div className="mt-3 space-y-2">
                    {summary.priorityItems.length === 0 ? (
                      <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">目前没有高优先级反馈。</p>
                    ) : (
                      summary.priorityItems.map((item) => (
                        <div key={item.id} className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
                          <p className="font-semibold">
                            {feedbackTypeLabels[item.type]} · {feedbackStatusLabels[item.status]}
                          </p>
                          <p className="mt-1 line-clamp-2">{item.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <h3 className="font-bold text-slate-900">问题类型分布</h3>
                  <p className="mt-1 text-xs text-slate-500">判断用户主要卡在内容、功能还是体验上。</p>
                  <div className="mt-3 space-y-2">
                    {summary.typeCounts.length === 0 ? (
                      <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-500">暂无反馈数据。</p>
                    ) : (
                      summary.typeCounts.map(([feedbackType, count]) => (
                        <div key={feedbackType} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                          <span className="font-medium text-slate-700">{feedbackTypeLabels[feedbackType]}</span>
                          <span className="font-bold text-slate-950">{count}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </section>

            <form onSubmit={handleSearch} className="mt-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_160px_180px_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="搜索编号、内容、联系方式、页面 URL" className={`${inputClass} w-full pl-9`} />
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
              <button className="interactive-button h-11 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700">筛选</button>
            </form>
          </>
        ) : null}

        {message ? <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
        {error ? <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

        <div className="mt-5 space-y-4">
          {loading ? <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">正在读取反馈...</div> : null}
          {!loading && currentUser.isAuthenticated && items.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">暂无符合条件的反馈。</div> : null}
          {items.map((item) => {
            const itemMessage = itemMessages[item.id];
            const statusDraft = statusDrafts[item.id] ?? item.status;
            const statusChanged = statusDraft !== item.status;

            return (
            <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {item.feedbackNo ? <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{item.feedbackNo}</span> : null}
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{feedbackTypeLabels[item.type]}</span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusClass(item.status)}`}>
                      {feedbackStatusLabels[item.status]}
                    </span>
                    <span className="text-xs text-slate-400">提交：{formatDate(item.createdAt)}</span>
                    <span className="text-xs text-slate-400">状态更新：{formatDate(item.statusChangedAt ?? item.updatedAt)}</span>
                  </div>
                  <div className="mt-3 grid gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600 md:grid-cols-3">
                    <p>
                      <span className="font-semibold text-slate-800">提交用户：</span>
                      {item.userEmail || item.userName || (item.userId ? item.userId : "游客")}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-800">联系方式：</span>
                      {item.contact || item.userEmail || "未填写"}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-800">用户角色：</span>
                      {item.userRole === "guest" ? "游客" : item.userRole === "admin" ? "管理员" : "普通用户"}
                    </p>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-800">{item.content}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={statusDraft}
                    disabled={busyId === item.id}
                    onChange={(event) => setStatusDrafts((values) => ({ ...values, [item.id]: event.target.value as FeedbackStatus }))}
                    className="h-10 rounded-xl border border-slate-200 px-3 text-sm disabled:opacity-60"
                  >
                    {feedbackStatusOptions.map((option) => (
                      <option key={option} value={option}>
                        {feedbackStatusLabels[option]}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={busyId === item.id || !statusChanged}
                    onClick={() => void updateFeedback(item, statusDraft)}
                    className="interactive-button h-10 rounded-xl border border-sky-200 bg-sky-50 px-3 text-sm font-semibold text-sky-700 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    保存状态
                  </button>
                  <button
                    type="button"
                    disabled={busyId === item.id}
                    onClick={() => void deleteFeedback(item)}
                    className="interactive-button h-10 rounded-xl border border-rose-200 bg-rose-50 px-3 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                  >
                    删除反馈
                  </button>
                </div>
              </div>

              <label className="mt-4 block text-sm font-semibold text-slate-900">
                管理员回复（用户可见）
                <textarea
                  value={replyDrafts[item.id] ?? ""}
                  onChange={(event) => setReplyDrafts((value) => ({ ...value, [item.id]: event.target.value }))}
                  placeholder="给用户看的处理回复，例如：已核实，图片信息已更新。"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm leading-6 outline-none focus:border-emerald-500"
                  rows={3}
                />
              </label>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={busyId === item.id}
                  onClick={() => void updateFeedback(item, statusDraft)}
                  className="interactive-button h-10 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                >
                  {busyId === item.id ? "保存中..." : "保存回复"}
                </button>
                {itemMessage ? (
                  <span className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 ${itemMessageClass(itemMessage.type)}`}>
                    {itemMessage.text}
                  </span>
                ) : null}
              </div>

              <div className="mt-4 grid gap-2 text-xs text-slate-500 md:grid-cols-2">
                {item.contact ? <p>联系方式：{item.contact}</p> : <p>联系方式：未填写</p>}
                {item.deviceType ? <p>设备：{item.deviceType}</p> : <p>设备：未记录</p>}
                {item.pageUrl ? (
                  <a href={item.pageUrl} target="_blank" rel="noopener noreferrer" className="interactive-text-link inline-flex min-w-0 items-center gap-1 text-emerald-700 md:col-span-2">
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{item.pageUrl}</span>
                  </a>
                ) : null}
                {item.userAgent ? <p className="truncate md:col-span-2">浏览器信息：{item.userAgent}</p> : null}
              </div>
            </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
