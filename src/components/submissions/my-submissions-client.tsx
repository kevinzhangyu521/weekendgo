"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Eye, Lock, Pencil, RotateCcw, Trash2, Unlock } from "lucide-react";
import type { SpotSubmission } from "@/features/submissions/types";
import { toChineseRegionName } from "@/lib/geo/region-names";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { createClient } from "@/lib/supabase/client";

type Notification = {
  id: string;
  title: string;
  body: string;
};

type MineResponse = {
  ok?: boolean;
  submissions?: SpotSubmission[];
  notifications?: Notification[];
  message?: string;
};

const statusMap: Record<SpotSubmission["status"], { label: string; className: string; message: string }> = {
  pending: {
    label: "\u5f85\u5ba1\u6838",
    className: "bg-amber-50 text-amber-700 ring-amber-200",
    message: "\u5df2\u6536\u5230\u4f60\u7684\u6295\u7a3f\uff0c\u6211\u4eec\u4f1a\u5c3d\u5feb\u5ba1\u6838\u3002"
  },
  approved: {
    label: "\u5df2\u901a\u8fc7",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    message: "\u5ba1\u6838\u5df2\u901a\u8fc7\uff0c\u5730\u70b9\u5df2\u53d1\u5e03\u5230\u76ee\u7684\u5730\u5217\u8868\u3002"
  },
  needs_changes: {
    label: "\u9700\u4fee\u6539",
    className: "bg-sky-50 text-sky-700 ring-sky-200",
    message: "\u8bf7\u6839\u636e\u7ba1\u7406\u5458\u5907\u6ce8\u4fee\u6539\u540e\u518d\u6b21\u63d0\u4ea4\u3002"
  },
  rejected: {
    label: "\u672a\u901a\u8fc7",
    className: "bg-rose-50 text-rose-700 ring-rose-200",
    message: "\u8fd9\u6761\u6295\u7a3f\u672a\u901a\u8fc7\u5ba1\u6838\uff0c\u8bf7\u67e5\u770b\u7ba1\u7406\u5458\u5907\u6ce8\u3002"
  }
};

async function authHeaders() {
  const supabase = createClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
  return headers;
}

function formatRegion(item: SpotSubmission) {
  const province = item.provinceZh || toChineseRegionName(item.province);
  const city = item.cityZh || toChineseRegionName(item.city);
  if (!province || province === city) return city;
  return `${province} ${city}`;
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

function getDeleteCountdown(deletedAt: string | null) {
  if (!deletedAt) return "\u5269\u4f59 24 \u5c0f\u65f6";
  const expiresAt = new Date(deletedAt).getTime() + 24 * 60 * 60 * 1000;
  const totalMinutes = Math.ceil(Math.max(0, expiresAt - Date.now()) / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (totalMinutes <= 0) return "\u5373\u5c06\u6c38\u4e45\u5220\u9664";
  if (hours <= 0) return `\u5269\u4f59 ${minutes} \u5206\u949f`;
  return minutes === 0 ? `\u5269\u4f59 ${hours} \u5c0f\u65f6` : `\u5269\u4f59 ${hours} \u5c0f\u65f6 ${minutes} \u5206\u949f`;
}

export function MySubmissionsClient() {
  const currentUser = useCurrentUser();
  const [submissions, setSubmissions] = useState<SpotSubmission[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function loadSubmissions() {
    if (currentUser.isLoading) return;
    if (!currentUser.isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/submissions/mine", { headers: await authHeaders(), credentials: "include", cache: "no-store" });
      const result = (await response.json()) as MineResponse;
      if (!response.ok || !result.ok) throw new Error(result.message ?? "\u8bfb\u53d6\u6295\u7a3f\u5931\u8d25\u3002");
      setSubmissions(result.submissions ?? []);
      setNotifications(result.notifications ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "\u8bfb\u53d6\u6295\u7a3f\u5931\u8d25\u3002");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.isAuthenticated, currentUser.isLoading]);

  async function runAction(id: string, action: "lock" | "unlock" | "delete" | "restore") {
    setBusyId(id);
    setError("");
    try {
      const response = await fetch("/api/submissions/action", {
        method: "POST",
        headers: await authHeaders(),
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({ id, action })
      });
      const result = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !result.ok) throw new Error(result.message ?? "\u64cd\u4f5c\u5931\u8d25\u3002");
      await loadSubmissions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "\u64cd\u4f5c\u5931\u8d25\u3002");
    } finally {
      setBusyId(null);
    }
  }

  const activeSubmissions = submissions.filter((item) => !item.deletedAt);
  const deletedSubmissions = submissions.filter((item) => item.deletedAt);

  function renderAdminNote(item: SpotSubmission) {
    if (!item.reviewNote && item.status !== "rejected" && item.status !== "needs_changes") return null;
    return (
      <div className={`mt-3 rounded-lg border p-3 text-sm ${item.status === "rejected" ? "border-rose-100 bg-rose-50 text-rose-700" : "border-sky-100 bg-sky-50 text-sky-700"}`}>
        <p className="font-semibold">{"\u7ba1\u7406\u5458\u5907\u6ce8"}</p>
        <p className="mt-1">{item.reviewNote || "\u6682\u65e0\u5177\u4f53\u5907\u6ce8\u3002"}</p>
      </div>
    );
  }

  function renderCard(item: SpotSubmission, deleted = false) {
    const status = statusMap[item.status];
    const canEdit = !deleted && !item.isLocked && (item.status === "pending" || (item.status === "needs_changes" && item.allowResubmit));

    return (
      <article key={item.id} className={`rounded-xl border bg-white p-5 shadow-sm ${deleted ? "border-slate-200 opacity-80" : "border-slate-200"}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500">{"\u63d0\u4ea4\u65f6\u95f4\uff1a"}{formatDate(item.createdAt)}</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">{item.nameZh || item.name}</h2>
            <p className="mt-1 text-sm text-slate-600">{formatRegion(item)}</p>
            {item.address ? <p className="mt-1 text-sm text-slate-600">{"\u5730\u5740\uff1a"}{item.address}</p> : null}
            <p className="mt-1 text-xs text-slate-400">{"\u66f4\u65b0\u65f6\u95f4\uff1a"}{formatDate(item.updatedAt || item.createdAt)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {item.isLocked ? <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200"><Lock className="h-3.5 w-3.5" />{"\u5df2\u9501\u5b9a"}</span> : null}
            {deleted ? <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">{getDeleteCountdown(item.deletedAt)}</span> : <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${status.className}`}>{status.label}</span>}
          </div>
        </div>

        <p className="mt-3 text-sm text-slate-700">
          {deleted ? `\u8fd9\u6761\u6295\u7a3f\u5df2\u79fb\u5230\u5df2\u5220\u9664\u5217\u8868\uff0c${getDeleteCountdown(item.deletedAt)}\u540e\u5c06\u6c38\u4e45\u5220\u9664\uff0c\u671f\u95f4\u4ecd\u53ef\u6062\u590d\u3002` : status.message}
        </p>

        {!deleted ? renderAdminNote(item) : null}

        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          {deleted ? (
            <button onClick={() => runAction(item.id, "restore")} disabled={busyId === item.id} className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-medium text-emerald-700 disabled:opacity-50">
              <RotateCcw className="h-4 w-4" />{"\u6062\u590d\u6295\u7a3f"}
            </button>
          ) : (
            <>
              {item.status === "approved" && item.publishedDestinationId ? (
                <Link href={`/destinations/${item.publishedDestinationId}`} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white">
                  <Eye className="h-4 w-4" />{"\u67e5\u770b\u5730\u70b9"}
                </Link>
              ) : null}
              {canEdit ? (
                <Link href={`/my-submissions/${item.id}/edit`} className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-medium text-emerald-700">
                  <Pencil className="h-4 w-4" />{"\u4fee\u6539\u6295\u7a3f"}
                </Link>
              ) : null}
              <button onClick={() => runAction(item.id, item.isLocked ? "unlock" : "lock")} disabled={busyId === item.id} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50">
                {item.isLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                {item.isLocked ? "\u89e3\u9501" : "\u9501\u5b9a"}
              </button>
              <button onClick={() => runAction(item.id, "delete")} disabled={item.isLocked || busyId === item.id} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-rose-700 disabled:cursor-not-allowed disabled:opacity-40">
                <Trash2 className="h-4 w-4" />{"\u79fb\u5230\u5df2\u5220\u9664"}
              </button>
            </>
          )}
        </div>
      </article>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="qmd-container py-6">
        <h1 className="text-2xl font-bold text-slate-900">{"\u6211\u7684\u6295\u7a3f"}</h1>
        <p className="mt-2 text-sm text-slate-600">{"\u67e5\u770b\u4f60\u63d0\u4ea4\u7684\u5730\u70b9\u548c\u5ba1\u6838\u8fdb\u5ea6\u3002"}</p>

        {loading ? <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">{"\u6b63\u5728\u8bfb\u53d6\u6295\u7a3f..."}</div> : null}

        {!loading && !currentUser.isAuthenticated ? (
          <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
            <p className="font-medium text-slate-900">{"\u8bf7\u5148\u767b\u5f55\uff0c\u7136\u540e\u67e5\u770b\u4f60\u63d0\u4ea4\u7684\u5730\u70b9\u5ba1\u6838\u7ed3\u679c\u3002"}</p>
            <Link href="/login?next=/my-submissions" className="mt-3 inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">{"\u53bb\u767b\u5f55"}</Link>
          </div>
        ) : null}

        {error ? <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{error}</div> : null}

        {notifications.length > 0 ? (
          <section className="mt-5 space-y-2 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
            <h2 className="text-sm font-bold text-emerald-900">{"\u6700\u65b0\u901a\u77e5"}</h2>
            {notifications.map((item) => <div key={item.id} className="rounded-lg bg-white/80 p-3 text-sm text-slate-700"><p className="font-semibold text-slate-900">{item.title}</p><p className="mt-1">{item.body}</p></div>)}
          </section>
        ) : null}

        {!loading && currentUser.isAuthenticated && activeSubmissions.length === 0 ? (
          <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
            <p className="font-medium text-slate-900">{"\u4f60\u8fd8\u6ca1\u6709\u63d0\u4ea4\u8fc7\u5730\u70b9\u3002"}</p>
            <Link href="/submit-spot" className="mt-3 inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">{"\u6dfb\u52a0\u5730\u70b9"}</Link>
          </div>
        ) : null}

        {activeSubmissions.length > 0 ? <div className="mt-5 space-y-4">{activeSubmissions.map((item) => renderCard(item))}</div> : null}

        {deletedSubmissions.length > 0 ? (
          <section className="mt-8">
            <h2 className="text-base font-bold text-slate-900">{"\u5df2\u5220\u9664\u6295\u7a3f"}</h2>
            <div className="mt-4 space-y-4">{deletedSubmissions.map((item) => renderCard(item, true))}</div>
          </section>
        ) : null}
      </section>
    </main>
  );
}
