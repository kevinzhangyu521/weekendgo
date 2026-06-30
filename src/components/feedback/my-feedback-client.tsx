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
  if (!value) return "\u6682\u65e0\u8bb0\u5f55";
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
        if (!response.ok || !result.ok) throw new Error(result.message ?? "\u8bfb\u53d6\u6211\u7684\u53cd\u9988\u5931\u8d25\u3002");
        if (mounted) setItems(result.items ?? []);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "\u8bfb\u53d6\u6211\u7684\u53cd\u9988\u5931\u8d25\u3002");
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
      <section className="qmd-container py-6">
        <div className="mb-5">
          <h1 className="inline-flex items-center gap-2 text-2xl font-bold text-slate-900">
            <MessageSquare className="h-6 w-6 text-emerald-600" />
            {"\u6211\u7684\u53cd\u9988"}
          </h1>
          <p className="mt-2 text-sm text-slate-600">{"\u67e5\u770b\u4f60\u63d0\u4ea4\u7684\u95ee\u9898\u3001\u5efa\u8bae\u548c\u5904\u7406\u8fdb\u5ea6\u3002"}</p>
        </div>

        {loading ? <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">{"\u6b63\u5728\u8bfb\u53d6\u6211\u7684\u53cd\u9988..."}</div> : null}

        {!loading && !currentUser.isAuthenticated ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-700">
            <p className="font-medium">{"\u8bf7\u5148\u767b\u5f55\uff0c\u7136\u540e\u67e5\u770b\u4f60\u7684\u53cd\u9988\u5904\u7406\u8fdb\u5ea6\u3002"}</p>
            <Link href="/login?next=/my-feedback" className="interactive-button mt-4 inline-flex rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
              {"\u53bb\u767b\u5f55"}
            </Link>
          </div>
        ) : null}

        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">{error}</div> : null}

        {!loading && currentUser.isAuthenticated && items.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-700">
            <p className="font-medium">{"\u6682\u65e0\u53cd\u9988\u3002"}</p>
            <p className="mt-1 text-sm text-slate-600">{"\u4f60\u53ef\u4ee5\u70b9\u51fb\u53f3\u4e0b\u89d2\u201c\u53cd\u9988\u201d\u63d0\u4ea4\u95ee\u9898\u6216\u5efa\u8bae\u3002"}</p>
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
                  <p className="font-semibold">{"\u7ba1\u7406\u5458\u56de\u590d"}</p>
                  <p className="mt-1 whitespace-pre-wrap leading-6">{item.adminReply}</p>
                </div>
              ) : (
                <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">{"\u7ba1\u7406\u5458\u6682\u672a\u56de\u590d\uff0c\u6709\u8fdb\u5c55\u540e\u4f1a\u5728\u8fd9\u91cc\u66f4\u65b0\u3002"}</div>
              )}

              <div className="mt-4 grid gap-2 text-xs text-slate-500 md:grid-cols-2">
                <p>{"\u63d0\u4ea4\u65f6\u95f4\uff1a"}{formatDate(item.createdAt)}</p>
                <p>{"\u72b6\u6001\u66f4\u65b0\u65f6\u95f4\uff1a"}{formatDate(item.statusChangedAt ?? item.updatedAt)}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
