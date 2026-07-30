"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ContentHealthSummary } from "@/features/admin/content-health";
import { createClient } from "@/lib/supabase/client";

type ContentQualityItem = {
  id: string;
  name: string;
  nameZh: string | null;
  city: string;
  cityZh: string | null;
  isActive: boolean;
  updatedAt: string | null;
  health: ContentHealthSummary;
};

type ContentQualityResponse = {
  ok?: boolean;
  isAdmin?: boolean;
  items?: ContentQualityItem[];
  message?: string;
};

type FilterKey = "all" | "required" | "recommended" | "missing-cover" | "missing-experience" | "inactive";
type SortKey = "content-asc" | "image-asc" | "experience-asc" | "updated-desc";

const text = {
  all: "\u5168\u90e8",
  required: "\u5fc5\u987b\u5b8c\u5584",
  recommended: "\u5efa\u8bae\u4f18\u5316",
  missingCover: "\u7f3a\u5c01\u9762",
  missingExperience: "\u7f3a\u771f\u5b9e\u4f53\u9a8c",
  inactive: "\u5df2\u4e0b\u67b6",
  contentAsc: "\u5185\u5bb9\u5b8c\u6574\u5ea6\u4f4e\u5230\u9ad8",
  imageAsc: "\u56fe\u7247\u5b8c\u6574\u5ea6\u4f4e\u5230\u9ad8",
  experienceAsc: "\u4f53\u9a8c\u6570\u91cf\u5c11\u5230\u591a",
  updatedDesc: "\u6700\u8fd1\u66f4\u65b0",
  noUpdatedAt: "\u6682\u65e0\u66f4\u65b0\u65f6\u95f4",
  cityMissing: "\u57ce\u5e02\u672a\u8bbe\u7f6e",
  loadFailed: "\u8bfb\u53d6\u5185\u5bb9\u8d28\u91cf\u6570\u636e\u5931\u8d25\u3002",
  back: "\u8fd4\u56de\u540e\u53f0\u7ba1\u7406",
  title: "\u5185\u5bb9\u8d28\u91cf\u5de5\u4f5c\u53f0",
  description: "\u96c6\u4e2d\u67e5\u770b\u76ee\u7684\u5730\u5185\u5bb9\u5b8c\u6574\u5ea6\u3001\u56fe\u7247\u5b8c\u6574\u5ea6\u548c\u771f\u5b9e\u4f53\u9a8c\u7f3a\u53e3\u3002",
  loading: "\u6b63\u5728\u8bfb\u53d6\u5185\u5bb9\u8d28\u91cf\u6570\u636e...",
  showing: "\u5f53\u524d\u663e\u793a",
  destinations: "\u4e2a\u76ee\u7684\u5730",
  active: "\u5df2\u4e0a\u7ebf",
  updatedAt: "\u6700\u8fd1\u66f4\u65b0\uff1a",
  contentScore: "\u5185\u5bb9\u5b8c\u6574\u5ea6",
  imageScore: "\u56fe\u7247\u5b8c\u6574\u5ea6",
  experience: "\u771f\u5b9e\u4f53\u9a8c",
  coreComplete: "\u6838\u5fc3\u5185\u5bb9\u5df2\u8865\u9f50",
  opsComplete: "\u8fd0\u8425\u4fe1\u606f\u5df2\u6bd4\u8f83\u5b8c\u6574",
  coverIssue: "\u5c01\u9762\u56fe",
  familyExperienceIssue: "\u5bb6\u5ead\u4f53\u9a8c"
};

const filters: Array<{ value: FilterKey; label: string }> = [
  { value: "all", label: text.all },
  { value: "required", label: text.required },
  { value: "recommended", label: text.recommended },
  { value: "missing-cover", label: text.missingCover },
  { value: "missing-experience", label: text.missingExperience },
  { value: "inactive", label: text.inactive }
];

const sorts: Array<{ value: SortKey; label: string }> = [
  { value: "content-asc", label: text.contentAsc },
  { value: "image-asc", label: text.imageAsc },
  { value: "experience-asc", label: text.experienceAsc },
  { value: "updated-desc", label: text.updatedDesc }
];

async function authHeaders() {
  const supabase = createClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();
  const headers: Record<string, string> = {};
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
  return headers;
}

function healthBadgeClass(score: number) {
  if (score >= 80) return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (score >= 50) return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-rose-200 bg-rose-50 text-rose-700";
}

function formatDate(value: string | null) {
  if (!value) return text.noUpdatedAt;
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(value));
}

function destinationName(item: ContentQualityItem) {
  return item.nameZh || item.name;
}

function destinationCity(item: ContentQualityItem) {
  return item.cityZh || item.city || text.cityMissing;
}

function applyFilter(items: ContentQualityItem[], filter: FilterKey) {
  if (filter === "required") return items.filter((item) => item.health.requiredIssues.length > 0);
  if (filter === "recommended") return items.filter((item) => item.health.recommendedIssues.length > 0);
  if (filter === "missing-cover") return items.filter((item) => item.health.requiredIssues.includes(text.coverIssue));
  if (filter === "missing-experience") return items.filter((item) => item.health.recommendedIssues.includes(text.familyExperienceIssue));
  if (filter === "inactive") return items.filter((item) => !item.isActive);
  return items;
}

function applySort(items: ContentQualityItem[], sort: SortKey) {
  return [...items].sort((a, b) => {
    if (sort === "image-asc") return a.health.imageScore - b.health.imageScore;
    if (sort === "experience-asc") return a.health.experienceTotal - b.health.experienceTotal;
    if (sort === "updated-desc") return Date.parse(b.updatedAt ?? "") - Date.parse(a.updatedAt ?? "");
    return a.health.contentScore - b.health.contentScore;
  });
}

export function ContentQualityWorkbenchClient() {
  const [items, setItems] = useState<ContentQualityItem[]>([]);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<SortKey>("content-asc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadItems() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/admin/content-quality", {
          headers: await authHeaders(),
          credentials: "include",
          cache: "no-store"
        });
        const result = (await response.json()) as ContentQualityResponse;
        if (!response.ok || !result.ok) throw new Error(result.message ?? text.loadFailed);
        if (mounted) setItems(result.items ?? []);
      } catch (err) {
        if (mounted) {
          setItems([]);
          setError(err instanceof Error ? err.message : text.loadFailed);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadItems();
    return () => {
      mounted = false;
    };
  }, []);

  const visibleItems = useMemo(() => applySort(applyFilter(items, filter), sort), [filter, items, sort]);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="qmd-container py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Link href="/admin" className="text-sm font-semibold text-emerald-700 hover:underline">
              {text.back}
            </Link>
            <h1 className="mt-3 text-2xl font-black text-slate-950">{text.title}</h1>
            <p className="mt-2 text-sm text-slate-500">{text.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={filter} onChange={(event) => setFilter(event.target.value as FilterKey)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700">
              {filters.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
            <select value={sort} onChange={(event) => setSort(event.target.value as SortKey)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700">
              {sorts.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">{text.loading}</div> : null}
        {error ? <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm font-semibold text-amber-900">{error}</div> : null}

        {!loading && !error ? (
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3 text-sm text-slate-600">
              {text.showing} {visibleItems.length} {text.destinations}
              {visibleItems.length !== items.length ? <span className="ml-2 text-slate-400">{text.all} {items.length} {text.destinations}</span> : null}
            </div>
            <div className="divide-y divide-slate-100">
              {visibleItems.map((item) => (
                <Link key={item.id} href={`/admin/destinations/${item.id}/edit`} className="block p-4 transition hover:bg-slate-50">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-bold text-slate-950">{destinationName(item)}</h2>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{destinationCity(item)}</span>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-200 text-slate-700"}`}>
                          {item.isActive ? text.active : text.inactive}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">{text.updatedAt}{formatDate(item.updatedAt)}</p>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className={`rounded-full border px-2.5 py-1 font-semibold ${healthBadgeClass(item.health.contentScore)}`}>
                        {text.contentScore} {item.health.contentScore}%
                      </span>
                      <span className={`rounded-full border px-2.5 py-1 font-semibold ${healthBadgeClass(item.health.imageScore)}`}>
                        {text.imageScore} {item.health.imageScore}%
                      </span>
                      <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 font-semibold text-sky-800">
                        {text.experience} {item.health.experienceTotal}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    <div>
                      <p className="text-xs font-bold text-rose-700">{text.required}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        {item.health.requiredIssues.length > 0 ? item.health.requiredIssues.map((issue) => (
                          <span key={issue} className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 font-semibold text-rose-700">{issue}</span>
                        )) : <span className="text-emerald-700">{text.coreComplete}</span>}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-amber-700">{text.recommended}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        {item.health.recommendedIssues.length > 0 ? item.health.recommendedIssues.map((issue) => (
                          <span key={issue} className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 font-semibold text-amber-800">{issue}</span>
                        )) : <span className="text-emerald-700">{text.opsComplete}</span>}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
