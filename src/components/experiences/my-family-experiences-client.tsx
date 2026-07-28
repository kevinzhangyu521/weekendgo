"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  familyDestinationExperienceAgeLabels,
  familyDestinationExperienceStatusLabels,
  type FamilyDestinationExperience
} from "@/features/family-destination-experiences/types";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { createClient } from "@/lib/supabase/client";

type ApiResponse = {
  ok?: boolean;
  items?: FamilyDestinationExperience[];
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
  if (!value) return "未填写";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(value));
}

function statusClass(status: FamilyDestinationExperience["status"]) {
  if (status === "approved") return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  if (status === "rejected") return "bg-slate-100 text-slate-600 ring-slate-200";
  return "bg-amber-50 text-amber-700 ring-amber-100";
}

export function MyFamilyExperiencesClient() {
  const currentUser = useCurrentUser();
  const [items, setItems] = useState<FamilyDestinationExperience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadItems() {
      if (currentUser.isLoading) return;
      if (!currentUser.hasUser) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/family-destination-experiences/mine", {
          headers: await authHeaders(),
          credentials: "include",
          cache: "no-store"
        });
        const result = (await response.json()) as ApiResponse;
        if (!response.ok || !result.ok) throw new Error(result.message ?? "读取我的体验失败。");
        if (mounted) setItems(result.items ?? []);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "读取我的体验失败。");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadItems();

    return () => {
      mounted = false;
    };
  }, [currentUser.hasUser, currentUser.isLoading]);

  if (!currentUser.isLoading && !currentUser.hasUser) {
    return (
      <main className="qmd-container py-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-black text-slate-950">我的体验</h1>
          <p className="mt-2 text-sm text-slate-600">请先登录，然后查看你提交的家庭体验审核进度。</p>
          <Link href="/login?next=/my-experiences" className="interactive-button mt-4 inline-flex h-11 items-center rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-700">
            登录查看
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="qmd-container py-10">
      <div>
        <h1 className="text-2xl font-black text-slate-950">我的体验</h1>
        <p className="mt-2 text-sm text-slate-600">查看你提交的真实家庭体验，以及处理进度。</p>
      </div>

      {loading ? <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">正在读取...</div> : null}
      {error ? <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">{error}</div> : null}
      {!loading && !error && items.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">你还没有提交过家庭体验。</div>
      ) : null}

      <div className="mt-5 space-y-4">
        {items.map((item) => (
          <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-950">{item.destinationNameZh || item.destinationName || "目的地"}</h2>
                <p className="mt-1 text-xs text-slate-500">提交时间：{formatDate(item.createdAt)}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${statusClass(item.status)}`}>
                {familyDestinationExperienceStatusLabels[item.status]}
              </span>
            </div>
            <div className="mt-4 grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 md:grid-cols-2">
              <p><span className="font-bold text-slate-950">孩子年龄：</span>{familyDestinationExperienceAgeLabels[item.childAgeGroup]}</p>
              <p><span className="font-bold text-slate-950">出行日期：</span>{formatDate(item.visitedAt)}</p>
              <p className="md:col-span-2"><span className="font-bold text-emerald-700">推荐：</span>{item.recommendation}</p>
              <p className="md:col-span-2"><span className="font-bold text-amber-700">提醒：</span>{item.tip}</p>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
