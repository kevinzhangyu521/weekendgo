"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import type { FeedbackItem } from "@/features/feedback/types";
import { feedbackStatusLabels, feedbackTypeLabels } from "@/features/feedback/types";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { createClient } from "@/lib/supabase/client";

type FeedbackMineResponse = {
  ok?: boolean;
  items?: FeedbackItem[];
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

function formatDate(value: string | null) {
  if (!value) return "暂无记录";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function statusClass(status: FeedbackItem["status"]) {
  if (status === "completed") return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  if (status === "accepted") return "bg-teal-50 text-teal-700 ring-teal-100";
  if (status === "rejected") return "bg-slate-100 text-slate-600 ring-slate-200";
  if (status === "in_progress") return "bg-sky-50 text-sky-700 ring-sky-100";
  return "bg-amber-50 text-amber-700 ring-amber-100";
}

export function MyFeedbackClient() {
  const currentUser = useCurrentUser();
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadFeedback() {
      if (currentUser.isLoading) return;
      if (!currentUser.isAuthenticated) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/feedback/mine", {
          headers: await authHeaders(),
          credentials: "include",
          cache: "no-store"
        });
        const result = (await response.json()) as FeedbackMineResponse;
        if (!response.ok || !result.ok) throw new Error(result.message ?? "读取我的反馈失败。");
        if (mounted) setItems(result.items ?? []);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "读取我的反馈失败。");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadFeedback();

    return () => {
      mounted = false;
    };
  }, [currentUser.isAuthenticated, currentUser.isLoading]);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-5xl px-4 py-6 md:px-6">
        <div className="mb-5">
          <p className="text-sm font-medium text-emerald-700">栖美地反馈中心</p>
          <h1 className="mt-1 inline-flex items-center gap-2 text-2xl font-bold text-slate-900">
            <MessageSquare className="h-6 w-6 text-emerald-600" />
            我的反馈
          </h1>
          <p className="mt-2 text-sm text-slate-600">查看你提交的问题、建议和处理进度。</p>
        </div>

        {loading ? <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">正在读取我的反馈...</div> : null}

        {!loading && !currentUser.isAuthenticated ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-700">
            <p className="font-medium">请先登录，然后查看你的反馈处理进度。</p>
            <Link href="/login?next=/my-feedback" className="interactive-button mt-4 inline-flex rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
              去登录
            </Link>
          </div>
        ) : null}

        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">{error}</div> : null}

        {!loading && currentUser.isAuthenticated && items.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-700">
            <p className="font-medium">暂无反馈。</p>
            <p className="mt-1 text-sm text-slate-600">你可以点击右下角“反馈”提交问题或建议。</p>
          </div>
        ) : null}

        <div className="space-y-4">
          {items.map((item) => (
            <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                {item.feedbackNo ? <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{item.feedbackNo}</span> : null}
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{feedbackTypeLabels[item.type]}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusClass(item.status)}`}>{feedbackStatusLabels[item.status]}</span>
              </div>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-800">{item.content}</p>

              {item.adminReply ? (
                <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  <p className="font-semibold">管理员回复</p>
                  <p className="mt-1 whitespace-pre-wrap leading-6">{item.adminReply}</p>
                </div>
              ) : (
                <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">管理员暂未回复，有进展后会在这里更新。</div>
              )}

              <div className="mt-4 grid gap-2 text-xs text-slate-500 md:grid-cols-2">
                <p>提交时间：{formatDate(item.createdAt)}</p>
                <p>状态更新时间：{formatDate(item.statusChangedAt ?? item.updatedAt)}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
