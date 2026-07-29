"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/auth/roles";

type AdminUserDetail = {
  ok?: boolean;
  message?: string;
  user?: {
    id: string;
    email: string | null;
    phone: string | null;
    createdAt: string | null;
    updatedAt: string | null;
    lastSignInAt: string | null;
    emailConfirmedAt: string | null;
    phoneConfirmedAt: string | null;
  };
  profile?: {
    userId: string | null;
    nickname: string | null;
    avatarUrl: string | null;
    city: string | null;
    bio: string | null;
    role: UserRole;
    createdAt: string | null;
    updatedAt: string | null;
    exists: boolean;
  };
  counts?: {
    favorites: number;
    plans: number;
    submissions: number;
    feedbacks: number;
    experiences: number;
    familyApplications: number;
  };
  activity?: {
    favorites: FavoriteActivity[];
    plans: PlanActivity[];
    submissions: SubmissionActivity[];
    feedbacks: FeedbackActivity[];
    destinationExperiences: DestinationExperienceActivity[];
    familyApplications: FamilyApplicationActivity[];
  };
};

type FavoriteActivity = {
  id: string;
  destinationId: string;
  destinationName: string | null;
  destinationNameZh: string | null;
  createdAt: string;
};

type PlanActivity = {
  id: string;
  title: string;
  planDate: string;
  status: string;
  isPublic: boolean;
  shareSlug: string | null;
  itemCount: number;
};

type SubmissionActivity = {
  id: string;
  name: string;
  nameZh: string | null;
  city: string;
  cityZh: string | null;
  status: string;
  createdAt: string;
};

type FeedbackActivity = {
  id: string;
  feedbackNo: string | null;
  type: string;
  content: string;
  status: string;
  createdAt: string;
};

type DestinationExperienceActivity = {
  id: string;
  destinationName: string | null;
  destinationNameZh: string | null;
  childAgeGroup: string;
  visitedAt: string | null;
  recommendation: string;
  tip: string;
  status: string;
  createdAt: string;
};

type FamilyApplicationActivity = {
  id: string;
  applicationNo: string;
  parentName: string;
  contact: string;
  city: string;
  childrenAge: string | null;
  status: string;
  createdAt: string;
};

const roleLabels: Record<UserRole, string> = {
  user: "普通用户",
  admin: "管理员",
  super_admin: "超级管理员"
};

const statusLabels: Record<string, string> = {
  pending: "待审核",
  approved: "已通过",
  rejected: "已拒绝",
  in_progress: "处理中",
  accepted: "已受理",
  completed: "已完成",
  draft: "草稿",
  active: "已上线",
  inactive: "已下架"
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

function formatDate(value: string | null | undefined, fallback = "未记录") {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function formatDateTime(value: string | null | undefined, fallback = "未记录") {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function statusText(value: string | null | undefined) {
  if (!value) return "未记录";
  return statusLabels[value] ?? value;
}

function displayName(detail: AdminUserDetail | null) {
  return detail?.profile?.nickname?.trim() || detail?.user?.email?.trim() || detail?.user?.id || "未设置昵称";
}

function initialFrom(detail: AdminUserDetail | null) {
  return displayName(detail).slice(0, 1).toUpperCase();
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm text-slate-800">{value?.trim() || "未设置"}</p>
    </div>
  );
}

function ActivitySection({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-950">{title}</h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{count} 条</span>
      </div>
      <div className="mt-4">{count > 0 ? children : <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">暂无相关内容</p>}</div>
    </section>
  );
}

export default function AdminUserDetailPage() {
  const params = useParams<{ userId: string }>();
  const userId = params.userId;
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadDetail() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/admin/users/${userId}`, {
          headers: await authHeaders(),
          credentials: "include",
          cache: "no-store"
        });
        const result = (await response.json()) as AdminUserDetail;
        if (!response.ok || !result.ok) throw new Error(result.message ?? "读取用户详情失败。");
        if (!ignore) setDetail(result);
      } catch (err) {
        if (!ignore) {
          setDetail(null);
          setError(err instanceof Error ? err.message : "读取用户详情失败。");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void loadDetail();

    return () => {
      ignore = true;
    };
  }, [userId]);

  const counts = detail?.counts ?? {
    favorites: 0,
    plans: 0,
    submissions: 0,
    feedbacks: 0,
    experiences: 0,
    familyApplications: 0
  };
  const activity = useMemo(
    () =>
      detail?.activity ?? {
        favorites: [],
        plans: [],
        submissions: [],
        feedbacks: [],
        destinationExperiences: [],
        familyApplications: []
      },
    [detail]
  );

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="qmd-container py-6">
        <Link href="/admin/users" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50">
          <ArrowLeft className="h-4 w-4" />
          返回用户列表
        </Link>

        {loading ? (
          <div className="mt-6 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            正在读取用户详情...
          </div>
        ) : null}

        {!loading && error ? <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">{error}</div> : null}

        {!loading && detail?.user ? (
          <div className="mt-6 space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-600 text-xl font-black text-white md:h-20 md:w-20">
                    {detail.profile?.avatarUrl ? <img src={detail.profile.avatarUrl} alt="" className="h-full w-full object-cover" /> : initialFrom(detail)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="break-words text-2xl font-black text-slate-950 md:text-3xl">{displayName(detail)}</h1>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
                        {roleLabels[detail.profile?.role ?? "user"]}
                      </span>
                    </div>
                    <p className="mt-2 break-all text-sm text-slate-500">{detail.user.email ?? "邮箱未记录"}</p>
                    <p className="mt-1 break-all text-xs text-slate-400">用户 ID：{detail.user.id}</p>
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 md:min-w-64">
                  <p>注册时间：{formatDateTime(detail.user.createdAt)}</p>
                  <p className="mt-2">最近登录：{formatDateTime(detail.user.lastSignInAt)}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <InfoItem label="昵称" value={detail.profile?.nickname} />
                <InfoItem label="城市" value={detail.profile?.city} />
                <InfoItem label="简介" value={detail.profile?.bio} />
                <InfoItem label="资料状态" value={detail.profile?.exists ? "已创建用户资料" : "暂未创建用户资料"} />
              </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              <StatCard label="收藏数量" value={counts.favorites} />
              <StatCard label="计划数量" value={counts.plans} />
              <StatCard label="投稿数量" value={counts.submissions} />
              <StatCard label="反馈数量" value={counts.feedbacks} />
              <StatCard label="真实体验数量" value={counts.experiences} />
              <StatCard label="体验申请数量" value={counts.familyApplications} />
            </section>

            <div className="grid gap-5 lg:grid-cols-2">
              <ActivitySection title="收藏列表" count={activity.favorites.length}>
                <div className="space-y-3">
                  {activity.favorites.map((item) => (
                    <div key={item.id} className="rounded-xl bg-slate-50 p-4">
                      <p className="font-semibold text-slate-900">{item.destinationNameZh || item.destinationName || item.destinationId}</p>
                      <p className="mt-1 text-xs text-slate-500">收藏时间：{formatDateTime(item.createdAt)}</p>
                    </div>
                  ))}
                </div>
              </ActivitySection>

              <ActivitySection title="周末计划列表" count={activity.plans.length}>
                <div className="space-y-3">
                  {activity.plans.map((item) => (
                    <div key={item.id} className="rounded-xl bg-slate-50 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">{item.title}</p>
                        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">{statusText(item.status)}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">出发日期：{formatDate(item.planDate)} · {item.itemCount} 个地点</p>
                    </div>
                  ))}
                </div>
              </ActivitySection>

              <ActivitySection title="投稿列表" count={activity.submissions.length}>
                <div className="space-y-3">
                  {activity.submissions.map((item) => (
                    <div key={item.id} className="rounded-xl bg-slate-50 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">{item.nameZh || item.name}</p>
                        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">{statusText(item.status)}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{item.cityZh || item.city} · {formatDateTime(item.createdAt)}</p>
                    </div>
                  ))}
                </div>
              </ActivitySection>

              <ActivitySection title="反馈列表" count={activity.feedbacks.length}>
                <div className="space-y-3">
                  {activity.feedbacks.map((item) => (
                    <div key={item.id} className="rounded-xl bg-slate-50 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">{item.feedbackNo || "未生成编号"}</p>
                        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">{statusText(item.status)}</span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-700">{item.content}</p>
                      <p className="mt-1 text-xs text-slate-500">提交时间：{formatDateTime(item.createdAt)}</p>
                    </div>
                  ))}
                </div>
              </ActivitySection>

              <ActivitySection title="真实体验列表" count={activity.destinationExperiences.length}>
                <div className="space-y-3">
                  {activity.destinationExperiences.map((item) => (
                    <div key={item.id} className="rounded-xl bg-slate-50 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">{item.destinationNameZh || item.destinationName || "未关联目的地名称"}</p>
                        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">{statusText(item.status)}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">孩子年龄：{item.childAgeGroup} · 出行日期：{formatDate(item.visitedAt)}</p>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-700">{item.recommendation}</p>
                    </div>
                  ))}
                </div>
              </ActivitySection>

              <ActivitySection title="体验申请列表" count={activity.familyApplications.length}>
                <div className="space-y-3">
                  {activity.familyApplications.map((item) => (
                    <div key={item.id} className="rounded-xl bg-slate-50 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">{item.applicationNo}</p>
                        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">{statusText(item.status)}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{item.parentName} · {item.city} · {item.childrenAge || "孩子年龄未填写"}</p>
                      <p className="mt-1 text-xs text-slate-500">申请时间：{formatDateTime(item.createdAt)}</p>
                    </div>
                  ))}
                </div>
              </ActivitySection>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
