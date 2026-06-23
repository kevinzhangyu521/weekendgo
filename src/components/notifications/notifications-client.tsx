"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import type { NotificationItem } from "@/features/notifications/types";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/auth/use-current-user";

type NotificationsResponse = {
  ok?: boolean;
  items?: NotificationItem[];
  unreadCount?: number;
  message?: string;
};

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

export function NotificationsClient() {
  const currentUser = useCurrentUser();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function loadNotifications() {
    if (currentUser.isLoading) return;
    if (!currentUser.isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/notifications", {
        headers: await authHeaders(""),
        credentials: "include",
        cache: "no-store"
      });
      const result = (await response.json()) as NotificationsResponse;
      if (!response.ok || !result.ok) throw new Error(result.message ?? "\u8bfb\u53d6\u6d88\u606f\u5931\u8d25\u3002");
      setItems(result.items ?? []);
      setUnreadCount(result.unreadCount ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "\u8bfb\u53d6\u6d88\u606f\u5931\u8d25\u3002");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.isAuthenticated, currentUser.isLoading]);

  async function openNotification(item: NotificationItem) {
    setBusy(item.id);
    try {
      if (!item.isRead) {
        await fetch(`/api/notifications/${item.id}/read`, {
          method: "PATCH",
          headers: await authHeaders(),
          credentials: "include",
          cache: "no-store"
        });
      }
      window.location.assign(item.href);
    } finally {
      setBusy("");
    }
  }

  async function markAllRead() {
    setBusy("all");
    setError("");
    try {
      const response = await fetch("/api/notifications/read-all", {
        method: "PATCH",
        headers: await authHeaders(),
        credentials: "include",
        cache: "no-store"
      });
      const result = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !result.ok) throw new Error(result.message ?? "\u5168\u90e8\u6807\u8bb0\u5df2\u8bfb\u5931\u8d25\u3002");
      setItems((values) => values.map((item) => ({ ...item, isRead: true, readAt: item.readAt ?? new Date().toISOString() })));
      setUnreadCount(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "\u5168\u90e8\u6807\u8bb0\u5df2\u8bfb\u5931\u8d25\u3002");
    } finally {
      setBusy("");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-4xl px-4 py-6 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="inline-flex items-center gap-2 text-2xl font-bold text-slate-900">
              <Bell className="h-6 w-6 text-emerald-600" />
              \u901a\u77e5
            </h1>
            <p className="mt-2 text-sm text-slate-600">\u67e5\u770b\u53cd\u9988\u8fdb\u5ea6\u3001\u7ba1\u7406\u5458\u56de\u590d\u548c\u7cfb\u7edf\u63d0\u9192\u3002</p>
          </div>
          <button
            type="button"
            disabled={busy === "all" || unreadCount === 0}
            onClick={() => void markAllRead()}
            className="interactive-button inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <CheckCheck className="h-4 w-4" />
            \u5168\u90e8\u5df2\u8bfb
          </button>
        </div>

        {loading ? <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">\u6b63\u5728\u8bfb\u53d6\u6d88\u606f...</div> : null}
        {error ? <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">{error}</div> : null}
        {!loading && !currentUser.isAuthenticated ? <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700">\u8bf7\u5148\u767b\u5f55\uff0c\u7136\u540e\u67e5\u770b\u4f60\u7684\u6d88\u606f\u3002</div> : null}
        {!loading && currentUser.isAuthenticated && items.length === 0 ? <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">\u6682\u65e0\u6d88\u606f\u3002</div> : null}

        <div className="mt-5 space-y-3">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={busy === item.id}
              onClick={() => void openNotification(item)}
              className={`interactive-card block w-full rounded-2xl border p-4 text-left shadow-sm ${
                item.isRead ? "border-slate-200 bg-white" : "border-emerald-200 bg-emerald-50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-slate-950">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.content}</p>
                </div>
                {!item.isRead ? <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-rose-500" /> : null}
              </div>
              <p className="mt-3 text-xs text-slate-400">{formatDate(item.createdAt)}</p>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
