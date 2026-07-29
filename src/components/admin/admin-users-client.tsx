"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import type { UserRole } from "@/lib/auth/roles";

type AdminUserItem = {
  id: string;
  email: string | null;
  nickname: string | null;
  avatarUrl: string | null;
  city: string | null;
  bio: string | null;
  role: UserRole;
  createdAt: string | null;
  counts: {
    favorites: number;
    plans: number;
    submissions: number;
    feedbacks: number;
    experiences: number;
    familyApplications: number;
  };
};

type AdminUsersResponse = {
  ok?: boolean;
  isAdmin?: boolean;
  users?: AdminUserItem[];
  message?: string;
  emailSource?: string;
};

const roleLabels: Record<UserRole, string> = {
  user: "普通用户",
  admin: "管理员",
  super_admin: "超级管理员"
};

const roleOptions: Array<UserRole | ""> = ["", "user", "admin", "super_admin"];

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
  if (!value) return "未记录";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(value));
}

function initialFrom(user: AdminUserItem) {
  const source = user.nickname?.trim() || user.email?.trim() || user.id;
  return source.slice(0, 1).toUpperCase();
}

function roleClass(role: UserRole) {
  if (role === "super_admin") return "bg-purple-50 text-purple-700 ring-purple-100";
  if (role === "admin") return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  return "bg-slate-100 text-slate-600 ring-slate-200";
}

function countItems(user: AdminUserItem) {
  return [
    { label: "收藏", value: user.counts.favorites },
    { label: "计划", value: user.counts.plans },
    { label: "投稿", value: user.counts.submissions },
    { label: "反馈", value: user.counts.feedbacks },
    { label: "真实体验", value: user.counts.experiences },
    { label: "体验申请", value: user.counts.familyApplications }
  ];
}

function UserAvatar({ user }: { user: AdminUserItem }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-600 text-sm font-black text-white">
      {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" /> : initialFrom(user)}
    </div>
  );
}

export function AdminUsersClient() {
  const currentUser = useCurrentUser();
  const [q, setQ] = useState("");
  const [role, setRole] = useState<UserRole | "">("");
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [emailSource, setEmailSource] = useState("");

  const selectedUser = useMemo(() => users.find((user) => user.id === selectedId) ?? users[0] ?? null, [users, selectedId]);

  async function loadUsers(nextQ = q, nextRole = role) {
    if (currentUser.isLoading) return;
    if (!currentUser.isAuthenticated) {
      setLoading(false);
      setIsAdmin(false);
      return;
    }

    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (nextQ.trim()) params.set("q", nextQ.trim());
    if (nextRole) params.set("role", nextRole);

    try {
      const response = await fetch(`/api/admin/users?${params.toString()}`, {
        headers: await authHeaders(),
        credentials: "include",
        cache: "no-store"
      });
      const result = (await response.json()) as AdminUsersResponse;
      setIsAdmin(Boolean(result.isAdmin));
      if (!response.ok || !result.ok) throw new Error(result.message ?? "读取用户列表失败。");
      const nextUsers = result.users ?? [];
      setUsers(nextUsers);
      setEmailSource(result.emailSource ?? "");
      setSelectedId((current) => (nextUsers.some((user) => user.id === current) ? current : nextUsers[0]?.id ?? ""));
    } catch (err) {
      setUsers([]);
      setSelectedId("");
      setError(err instanceof Error ? err.message : "读取用户列表失败。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers("", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.isAuthenticated, currentUser.isLoading]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadUsers(q, role);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="qmd-container py-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">用户管理</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">查看用户资料、账号角色和站内行为概览。当前版本只读，不支持修改角色、禁用或删除。</p>
          </div>
          {emailSource ? <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">邮箱来源：{emailSource}</span> : null}
        </div>

        {loading ? <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">正在读取用户列表...</div> : null}
        {!loading && !currentUser.isAuthenticated ? (
          <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5">
            <p className="font-semibold text-slate-900">请先登录</p>
            <a href="/login?next=/admin/users" className="mt-4 inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">去登录</a>
          </div>
        ) : null}
        {!loading && currentUser.isAuthenticated && !isAdmin ? (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900">{error || "你没有管理员权限。"}</div>
        ) : null}

        {isAdmin ? (
          <>
            <form onSubmit={handleSearch} className="mt-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_180px_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="搜索昵称、城市、邮箱或用户 ID" className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-emerald-500" />
              </div>
              <select value={role} onChange={(event) => setRole(event.target.value as UserRole | "")} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500">
                {roleOptions.map((option) => (
                  <option key={option || "all"} value={option}>
                    {option ? roleLabels[option] : "全部角色"}
                  </option>
                ))}
              </select>
              <button className="h-11 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-700">搜索</button>
            </form>

            {error ? <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</div> : null}

            <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-4 py-3 text-sm text-slate-600">共 {users.length} 个用户</div>

                <div className="hidden md:block">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
                      <tr>
                        <th className="px-4 py-3">用户</th>
                        <th className="px-4 py-3">角色</th>
                        <th className="px-4 py-3">城市</th>
                        <th className="px-4 py-3">行为概览</th>
                        <th className="px-4 py-3">注册时间</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map((user) => (
                        <tr key={user.id} onClick={() => { window.location.href = `/admin/users/${user.id}`; }} className={`cursor-pointer transition hover:bg-slate-50 ${selectedUser?.id === user.id ? "bg-emerald-50/50" : ""}`}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <UserAvatar user={user} />
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-slate-900">{user.nickname || "未填写昵称"}</p>
                                <p className="truncate text-xs text-slate-500">{user.email || "邮箱未记录"}</p>
                                <p className="truncate text-[11px] text-slate-400">{user.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${roleClass(user.role)}`}>{roleLabels[user.role]}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{user.city || "未填写"}</td>
                          <td className="px-4 py-3 text-xs text-slate-600">
                            收藏 {user.counts.favorites} · 计划 {user.counts.plans} · 体验 {user.counts.experiences}
                          </td>
                          <td className="px-4 py-3 text-slate-500">{formatDate(user.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="divide-y divide-slate-100 md:hidden">
                  {users.map((user) => (
                    <button key={user.id} type="button" onClick={() => { window.location.href = `/admin/users/${user.id}`; }} className={`block w-full p-4 text-left ${selectedUser?.id === user.id ? "bg-emerald-50/60" : "bg-white"}`}>
                      <div className="flex items-start gap-3">
                        <UserAvatar user={user} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-slate-900">{user.nickname || "未填写昵称"}</p>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${roleClass(user.role)}`}>{roleLabels[user.role]}</span>
                          </div>
                          <p className="mt-1 truncate text-xs text-slate-500">{user.email || "邮箱未记录"}</p>
                          <p className="mt-1 text-xs text-slate-500">{user.city || "未填写城市"} · {formatDate(user.createdAt)}</p>
                          <p className="mt-2 text-xs text-slate-600">收藏 {user.counts.favorites} · 计划 {user.counts.plans} · 投稿 {user.counts.submissions} · 体验 {user.counts.experiences}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {!loading && users.length === 0 ? <div className="p-6 text-sm text-slate-500">没有找到符合条件的用户。</div> : null}
              </div>

              <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                {selectedUser ? (
                  <>
                    <div className="flex items-start gap-3">
                      <UserAvatar user={selectedUser} />
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900">{selectedUser.nickname || "未填写昵称"}</p>
                        <p className="mt-1 text-xs text-slate-500">{selectedUser.email || "邮箱未记录"}</p>
                        <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${roleClass(selectedUser.role)}`}>{roleLabels[selectedUser.role]}</span>
                      </div>
                    </div>

                    <div className="mt-5 space-y-3 text-sm">
                      <div>
                        <p className="text-xs font-semibold text-slate-400">用户 ID</p>
                        <p className="mt-1 break-all text-slate-700">{selectedUser.id}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-400">所在城市</p>
                        <p className="mt-1 text-slate-700">{selectedUser.city || "未填写"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-400">个人简介</p>
                        <p className="mt-1 leading-6 text-slate-700">{selectedUser.bio || "未填写"}</p>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-2">
                      {countItems(selectedUser).map((item) => (
                        <div key={item.label} className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-500">{item.label}</p>
                          <p className="mt-1 text-xl font-bold text-slate-900">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">选择一个用户查看详情。</p>
                )}
              </aside>
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}
