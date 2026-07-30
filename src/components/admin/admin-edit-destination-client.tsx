"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { calculateContentHealth, type ExperienceCounts, type FamilyDestinationExperienceStatus } from "@/features/admin/content-health";
import type { AdminDestination } from "@/features/admin/destinations";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { EditDestinationForm } from "@/app/admin/destinations/[id]/edit/edit-destination-form";

type DestinationResponse = {
  ok?: boolean;
  item?: AdminDestination | null;
  message?: string;
};

type FamilyExperienceStatusRow = {
  status: FamilyDestinationExperienceStatus;
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

function emptyExperienceCounts(): ExperienceCounts {
  return { approved: 0, pending: 0, rejected: 0 };
}

function healthBadgeClass(score: number) {
  if (score >= 80) return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (score >= 50) return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-rose-200 bg-rose-50 text-rose-700";
}

export function AdminEditDestinationClient({ id }: { id: string }) {
  const currentUser = useCurrentUser();
  const [item, setItem] = useState<AdminDestination | null>(null);
  const [experienceCounts, setExperienceCounts] = useState<ExperienceCounts>(emptyExperienceCounts);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadItem() {
      if (currentUser.isLoading) return;
      if (!currentUser.isAuthenticated) {
        setLoading(false);
        setError("请先登录管理员账号。");
        return;
      }

      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/admin/destinations/${id}`, {
          headers: await authHeaders(),
          credentials: "include",
          cache: "no-store"
        });
        const result = (await response.json()) as DestinationResponse;
        if (!response.ok || !result.ok || !result.item) throw new Error(result.message ?? "读取目的地失败。");
        if (mounted) setItem(result.item);

        const supabase = createClient();
        const experienceResult = await supabase
          .from("family_destination_experiences")
          .select("status")
          .eq("destination_id", id);
        if (!experienceResult.error) {
          const counts = emptyExperienceCounts();
          ((experienceResult.data ?? []) as FamilyExperienceStatusRow[]).forEach((experience) => {
            counts[experience.status] += 1;
          });
          if (mounted) setExperienceCounts(counts);
        }
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "读取目的地失败。");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadItem();
    return () => {
      mounted = false;
    };
  }, [currentUser.isAuthenticated, currentUser.isLoading, id]);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="qmd-container py-6">
        <Link href="/admin/destinations" className="text-sm text-emerald-700 hover:underline">
          返回目的地管理
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">编辑目的地</h1>
        <p className="mt-2 text-sm text-slate-600">修改后会立即影响前台目的地列表、详情页、地图和计划页。</p>

        {loading ? <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">正在读取...</div> : null}
        {error ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-amber-700">暂时无法编辑</p>
            <p className="mt-2 text-slate-700">{error}</p>
            <Link href="/admin/destinations" className="mt-5 inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
              返回目的地管理
            </Link>
          </div>
        ) : null}
        {item ? (
          <>
            {(() => {
              const health = calculateContentHealth(item, item.photos ?? [], experienceCounts);
              return (
                <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-3 py-1 text-sm font-bold ${healthBadgeClass(health.contentScore)}`}>
                      内容完整度 {health.contentScore}%
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-sm font-bold ${healthBadgeClass(health.imageScore)}`}>
                      图片完整度 {health.imageScore}%
                    </span>
                    <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sm font-bold text-sky-800">
                      真实体验记录 {health.experienceTotal}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-xl border border-rose-100 bg-rose-50 p-4">
                      <p className="text-sm font-bold text-rose-800">必须完善</p>
                      {health.requiredIssues.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-2 text-sm">
                          {health.requiredIssues.map((label) => (
                            <span key={label} className="rounded-full border border-rose-200 bg-white px-3 py-1 font-semibold text-rose-700">
                              ☐ {label}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-sm font-semibold text-emerald-700">核心内容已补齐。</p>
                      )}
                    </div>

                    <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                      <p className="text-sm font-bold text-amber-800">建议优化</p>
                      {health.recommendedIssues.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-2 text-sm">
                          {health.recommendedIssues.map((label) => (
                            <span key={label} className="rounded-full border border-amber-200 bg-white px-3 py-1 font-semibold text-amber-800">
                              ☐ {label}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-sm font-semibold text-emerald-700">运营信息已比较完整。</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
            <EditDestinationForm item={item} />
          </>
        ) : null}
      </section>
    </main>
  );
}
