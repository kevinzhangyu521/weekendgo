"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import type { Locale } from "@/lib/i18n/config";

type Props = {
  locale: Locale;
  initialEmail: string | null;
};

type ProfileResponse = {
  ok?: boolean;
  profile?: {
    nickname?: string | null;
    avatarUrl?: string | null;
  } | null;
};

const menuItems: Record<Locale, Array<{ href: string; label: string }>> = {
  zh: [
    { href: "/profile", label: "我的主页" },
    { href: "/favorites", label: "我的收藏" },
    { href: "/my-submissions", label: "我的投稿" },
    { href: "/plans", label: "我的计划" },
    { href: "/profile", label: "账号设置" }
  ],
  en: [
    { href: "/profile", label: "My home" },
    { href: "/favorites", label: "Favorites" },
    { href: "/my-submissions", label: "Submissions" },
    { href: "/plans", label: "Plans" },
    { href: "/profile", label: "Account settings" }
  ]
};

function initialFrom(name: string | null | undefined, email: string | null) {
  const source = name?.trim() || email?.trim() || "?";
  return source.slice(0, 1).toUpperCase();
}

export function HeaderAccountMenu({ locale, initialEmail }: Props) {
  const currentUser = useCurrentUser();
  const email = currentUser.isLoading ? initialEmail : currentUser.email;
  const isSignedIn = Boolean(email);
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [nickname, setNickname] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      if (!isSignedIn || currentUser.isLoading) {
        setNickname(null);
        setAvatarUrl(null);
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
        setNickname(result.profile.nickname ?? null);
        setAvatarUrl(result.profile.avatarUrl ?? null);
      } catch {
        if (!mounted) return;
        setNickname(null);
        setAvatarUrl(null);
      }
    }

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, [currentUser.isLoading, isSignedIn]);

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
        {locale === "zh" ? "登录" : "Log in"}
      </Link>
    );
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((value) => !value)}
        className="interactive-button flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-emerald-600 text-sm font-black text-white hover:bg-emerald-700"
        aria-label={locale === "zh" ? "打开账号菜单" : "Open account menu"}
      >
        {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : initialFrom(nickname, email)}
      </button>

      {menuOpen ? (
        <div className="absolute right-0 top-12 z-50 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
          <div className="border-b border-slate-100 px-3 py-2">
            <p className="truncate text-sm font-bold text-slate-900">{nickname || email}</p>
            {nickname ? <p className="truncate text-xs text-slate-500">{email}</p> : null}
          </div>
          <div className="py-2">
            {menuItems[locale].map((item) => (
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
            {signingOut ? (locale === "zh" ? "退出中..." : "Signing out...") : locale === "zh" ? "退出登录" : "Sign out"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
