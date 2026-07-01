"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import type { Scenario } from "@/features/destinations/types";
import type { UserProfile } from "@/features/profiles/types";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { createClient } from "@/lib/supabase/client";

const scenarios: Array<{ value: Scenario; label: string }> = [
  { value: "camping", label: "\u9732\u8425" },
  { value: "creek", label: "\u6eaf\u6eaa" },
  { value: "hiking", label: "\u5f92\u6b65" },
  { value: "picnic", label: "\u91ce\u9910" }
];

type ProfileResponse = {
  ok?: boolean;
  profile?: UserProfile | null;
  message?: string;
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

export function ProfileClient() {
  const currentUser = useCurrentUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setError("");

    if (!file) {
      setAvatarFile(null);
      setAvatarPreview(profile?.avatarUrl ?? null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("请上传图片格式的头像。");
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("头像图片不能超过 2MB。");
      event.target.value = "";
      return;
    }

    if (avatarPreview?.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function uploadAvatar(file: File) {
    const supabase = createClient();
    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session?.user?.id) throw new Error("登录状态已失效，请重新登录。");

    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filePath = `${session.user.id}/${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: true
    });

    if (uploadError) throw new Error("头像上传失败，请稍后再试。");

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    return data.publicUrl;
  }

  useEffect(() => {
    let mounted = true;
    async function loadProfile() {
      if (currentUser.isLoading) return;
      if (!currentUser.isAuthenticated) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/profile/me", { headers: await authHeaders(), credentials: "include", cache: "no-store" });
        const result = (await response.json()) as ProfileResponse;
        if (!response.ok || !result.ok || !result.profile) throw new Error(result.message ?? "\u8bfb\u53d6\u8d44\u6599\u5931\u8d25\u3002");
        if (mounted) {
          setProfile(result.profile);
          setAvatarPreview(result.profile.avatarUrl);
        }
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "\u8bfb\u53d6\u8d44\u6599\u5931\u8d25\u3002");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadProfile();
    return () => {
      mounted = false;
    };
  }, [currentUser.isAuthenticated, currentUser.isLoading]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    const form = new FormData(event.currentTarget);
    const nickname = String(form.get("nickname") ?? "").trim();
    if (!nickname) {
      setError("请填写昵称，评价会显示这个名称。");
      setSaving(false);
      return;
    }

    const kidAgeRaw = String(form.get("kid_age") ?? "").trim();

    try {
      const avatarUrl = avatarFile ? await uploadAvatar(avatarFile) : profile?.avatarUrl ?? null;
      const preferredScenarios = form
        .getAll("preferred_scenarios")
        .map(String)
        .filter((value): value is Scenario => scenarios.some((item) => item.value === value));
      const payload = {
        nickname,
        avatarUrl,
        bio: String(form.get("bio") ?? ""),
        homeCity: String(form.get("home_city") ?? ""),
        kidAge: kidAgeRaw ? Number(kidAgeRaw) : null,
        preferredScenarios,
        receiveNotifications: form.get("receive_notifications") === "on"
      };
      const response = await fetch("/api/profile/me", {
        method: "PUT",
        headers: await authHeaders(),
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify(payload)
      });
      const result = (await response.json()) as ProfileResponse;
      if (!response.ok || !result.ok) throw new Error(result.message ?? "\u4fdd\u5b58\u5931\u8d25\u3002");
      setMessage(result.message ?? "\u8d44\u6599\u5df2\u4fdd\u5b58\u3002");
      const nextProfile = profile ? { ...profile, ...payload } : null;
      setProfile(nextProfile);
      setAvatarFile(null);
      setAvatarPreview(avatarUrl);
      window.dispatchEvent(new CustomEvent("qimeide:profile-updated", { detail: { nickname, avatarUrl } }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "\u4fdd\u5b58\u5931\u8d25\u3002");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="qmd-container py-6">
        <h1 className="text-2xl font-bold text-slate-900">{"\u6211\u7684\u8d44\u6599"}</h1>
        <p className="mt-2 text-sm text-slate-600">{"\u8fd9\u4e9b\u4fe1\u606f\u5c06\u7528\u4e8e\u540e\u7eed\u63a8\u8350\u66f4\u9002\u5408\u4f60\u5bb6\u5ead\u7684\u5468\u672b\u6237\u5916\u5730\u70b9\u3002"}</p>

        {loading ? (
          <div className="mt-5 rounded-xl border border-slate-200 bg-white p-6 text-slate-700">{"\u6b63\u5728\u8bfb\u53d6\u8d44\u6599..."}</div>
        ) : !currentUser.isAuthenticated ? (
          <div className="mt-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-600">{"\u8bf7\u5148\u767b\u5f55\uff0c\u7136\u540e\u5b8c\u5584\u4f60\u7684\u5bb6\u5ead\u6237\u5916\u504f\u597d\u3002"}</p>
            <Link href="/login?next=/profile" className="mt-4 inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
              {"\u53bb\u767b\u5f55"}
            </Link>
          </div>
        ) : error && !profile ? (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">{error}</div>
        ) : profile ? (
          <>
            <Link href="/reset-password" className="mt-4 inline-flex rounded-lg border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-700">
              {"\u4fee\u6539\u5bc6\u7801"}
            </Link>
            <form onSubmit={handleSubmit} className="mt-5 space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-600 text-2xl font-black text-white">
                  {avatarPreview ? <img src={avatarPreview} alt="头像预览" className="h-full w-full object-cover" /> : (profile.nickname || profile.email || "?").slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <label className="block text-sm font-bold text-slate-900">
                    {"头像"}
                    <input name="avatar" type="file" accept="image/*" onChange={handleAvatarChange} className="mt-2 block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white" />
                  </label>
                  <p className="mt-2 text-xs text-slate-500">{"支持 JPG、PNG、WebP，图片不超过 2MB。"}</p>
                </div>
              </div>
              <label className="block text-sm font-bold text-slate-900">
                {"\u767b\u5f55\u90ae\u7bb1"}
                <input value={profile.email} disabled className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500" />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-bold text-slate-900">
                  {"\u6635\u79f0 *"}
                  <input name="nickname" required defaultValue={profile.nickname} placeholder={"\u4f8b\u5982\uff1a\u5c0f\u660e\u7238\u7238"} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  <span className="mt-1 block text-xs font-normal text-slate-500">{"\u4f60\u7684\u8bc4\u4ef7\u4f1a\u663e\u793a\u8fd9\u4e2a\u540d\u79f0\u3002"}</span>
                </label>
                <label className="block text-sm font-bold text-slate-900">
                  {"\u5e38\u4f4f\u57ce\u5e02"}
                  <input name="home_city" defaultValue={profile.homeCity} placeholder={"\u4f8b\u5982\uff1a\u6b66\u6c49"} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                </label>
              </div>
              <label className="block text-sm font-bold text-slate-900">
                {"个人简介"}
                <textarea name="bio" defaultValue={profile.bio} rows={3} placeholder={"例如：喜欢周末带孩子骑行、野餐和找溪水玩。"} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </label>
              <label className="block text-sm font-bold text-slate-900">
                {"\u5b69\u5b50\u5e74\u9f84"}
                <input name="kid_age" type="number" min="0" max="18" defaultValue={profile.kidAge ?? ""} placeholder={"\u4f8b\u5982\uff1a5"} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </label>
              <div>
                <p className="text-sm font-bold text-slate-900">{"\u504f\u597d\u573a\u666f"}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {scenarios.map((item) => (
                    <label key={item.value} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700">
                      <input name="preferred_scenarios" type="checkbox" value={item.value} defaultChecked={profile.preferredScenarios.includes(item.value)} />
                      {item.label}
                    </label>
                  ))}
                </div>
              </div>
              <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                <input name="receive_notifications" type="checkbox" defaultChecked={profile.receiveNotifications} />
                {"\u63a5\u6536\u5ba1\u6838\u7ed3\u679c\u548c\u6d3b\u52a8\u901a\u77e5"}
              </label>
              <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
                <button disabled={saving} className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                  {saving ? "\u4fdd\u5b58\u4e2d..." : "\u4fdd\u5b58\u8d44\u6599"}
                </button>
                {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
                {error ? <p className="text-sm text-rose-600">{error}</p> : null}
              </div>
            </form>
          </>
        ) : null}
      </section>
    </main>
  );
}
