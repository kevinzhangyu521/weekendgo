"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { isAdminRole, normalizeUserRole, type UserRole } from "@/lib/auth/roles";
import type { Locale } from "@/lib/i18n/config";

type Props = {
  locale: Locale;
  initialEmail: string | null;
  isAdmin: boolean;
};

type ProfileResponse = {
  ok?: boolean;
  profile?: {
    nickname?: string | null;
    avatarUrl?: string | null;
    role?: UserRole | string | null;
  } | null;
};

type ProfileUpdatedEvent = CustomEvent<{
  nickname?: string | null;
  avatarUrl?: string | null;
  role?: UserRole | string | null;
}>;

const userMenuItems = [
  { href: "/favorites", label: "我的收藏" },
  { href: "/plans", label: "我的计划" },
  { href: "/my-submissions", label: "我的投稿" },
  { href: "/my-feedback", label: "我的反馈" },
  { href: "/my-experiences", label: "我的体验" },
  { href: "/notifications", label: "我的消息" },
  { href: "/profile", label: "账号设置" }
];

const adminMenuItems = [
  { href: "/admin", label: "后台管理" },
  { href: "/admin/destinations", label: "管理所有目的地" },
  { href: "/admin/submissions", label: "管理投稿" },
  { href: "/admin/feedback", label: "管理反馈" },
  { href: "/admin/family-experience-applications", label: "体验家庭申请" },
  { href: "/admin/family-destination-experiences", label: "体验审核" },
  { href: "/admin/home-recommendations", label: "首页推荐管理" },
  { href: "/admin/settings", label: "管理员设置" },
  { href: "/notifications", label: "系统通知" },
  { href: "/profile", label: "账号设置" }
];

function initialFrom(name: string | null | undefined, email: string | null) {
  const source = name?.trim() || email?.trim() || "?";
  return source.slice(0, 1).toUpperCase();
}

export function HeaderAccountMenu({ initialEmail, isAdmin }: Props) {
  const pathname = usePathname();
  const currentUser = useCurrentUser();
  const email = currentUser.isLoading ? initialEmail : currentUser.email;
  const isSignedIn = Boolean(email);
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [nickname, setNickname] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profileRole, setProfileRole] = useState<UserRole>(isAdmin ? "admin" : "user");
  const menuRef = useRef<HTMLDivElement | null>(null);
  const effectiveIsAdmin = isAdminRole(profileRole);
  const menuItems = effectiveIsAdmin ? adminMenuItems : userMenuItems;

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function updateProfile(event: Event) {
      const detail = (event as ProfileUpdatedEvent).detail;
      if (!detail) return;
      if ("nickname" in detail) setNickname(detail.nickname ?? null);
      if ("avatarUrl" in detail) setAvatarUrl(detail.avatarUrl ?? null);
      if ("role" in detail) setProfileRole(normalizeUserRole(detail.role));
    }

    window.addEventListener("qimeide:profile-updated", updateProfile);
    return () => window.removeEventListener("qimeide:profile-updated", updateProfile);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      if (!isSignedIn || currentUser.isLoading) {
        setNickname(null);
        setAvatarUrl(null);
        setProfileRole("user");
        return;
      }

      const supabase = createClient();
      const {
        data: { session }
      } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;

      try {
        const response = await fetch("/api/profile/me", {
          headers,
          credentials: "include",
          cache: "no-store"
        });
        const result = (await response.json()) as ProfileResponse;
        if (!mounted || !result.ok || !result.profile) return;
        const nextRole = normalizeUserRole(result.profile.role);
        console.log("current profile role:", nextRole);
        setNickname(result.profile.nickname ?? null);
        setAvatarUrl(result.profile.avatarUrl ?? null);
        setProfileRole(nextRole);
      } catch {
        if (!mounted) return;
        setNickname(null);
        setAvatarUrl(null);
        setProfileRole(isAdmin ? "admin" : "user");
      }
    }

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, [currentUser.isLoading, isSignedIn, isAdmin]);

  async function handleSignOut() {
    setSigningOut(true);
    setMenuOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.assign("/");
  }

  if (!isSignedIn) {
    return (
      <Link href="/login" className="interactive-button inline-flex h-10 items-center justify-center rounded-full bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-700">
        登录
      </Link>
    );
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((value) => !value)}
        className="interactive-button flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-emerald-600 text-sm font-black text-white hover:bg-emerald-700"
        aria-label="打开账号菜单"
        aria-expanded={menuOpen}
      >
        {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : initialFrom(nickname, email)}
      </button>

      {menuOpen ? (
        <>
          <button type="button" aria-label="关闭账号菜单" className="fixed inset-0 z-40 cursor-default bg-transparent md:hidden" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-12 z-50 w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
            <div className="border-b border-slate-100 px-3 py-2">
              <p className="truncate text-sm font-bold text-slate-900">{nickname || email}</p>
              <p className="mt-1 text-xs font-semibold text-emerald-700">{effectiveIsAdmin ? "管理员" : "普通用户"}</p>
              {nickname ? <p className="truncate text-xs text-slate-500">{email}</p> : null}
            </div>
            <div className="py-2">
              {menuItems.map((item) => (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="block w-full rounded-xl border-t border-slate-100 px-3 py-2 text-left text-sm font-medium text-rose-600 hover:bg-rose-50"
              disabled={signingOut}
            >
              {signingOut ? "退出中..." : "退出登录"}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
