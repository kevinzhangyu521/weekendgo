"use client";

import Link from "next/link";
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
  { href: "/favorites", label: "\u6211\u7684\u6536\u85cf" },
  { href: "/plans", label: "\u6211\u7684\u8ba1\u5212" },
  { href: "/my-submissions", label: "\u6211\u7684\u6295\u7a3f" },
  { href: "/my-feedback", label: "\u6211\u7684\u53cd\u9988" },
  { href: "/notifications", label: "\u6211\u7684\u6d88\u606f" },
  { href: "/profile", label: "\u8d26\u53f7\u8bbe\u7f6e" }
];

const adminMenuItems = [
  { href: "/admin", label: "\u540e\u53f0\u7ba1\u7406" },
  { href: "/admin/destinations", label: "\u7ba1\u7406\u6240\u6709\u76ee\u7684\u5730" },
  { href: "/admin/submissions", label: "\u7ba1\u7406\u6295\u7a3f" },
  { href: "/admin/feedback", label: "\u7ba1\u7406\u53cd\u9988" },
  { href: "/admin/family-experience-applications", label: "体验家庭申请" },
  { href: "/admin/home-recommendations", label: "\u9996\u9875\u63a8\u8350\u7ba1\u7406" },
  { href: "/admin/settings", label: "\u7ba1\u7406\u5458\u8bbe\u7f6e" },
  { href: "/notifications", label: "\u7cfb\u7edf\u901a\u77e5" },
  { href: "/profile", label: "\u8d26\u53f7\u8bbe\u7f6e" }
];

function initialFrom(name: string | null | undefined, email: string | null) {
  const source = name?.trim() || email?.trim() || "?";
  return source.slice(0, 1).toUpperCase();
}

export function HeaderAccountMenu({ locale, initialEmail, isAdmin }: Props) {
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
        {locale === "zh" ? "\u767b\u5f55" : "Log in"}
      </Link>
    );
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((value) => !value)}
        className="interactive-button flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-emerald-600 text-sm font-black text-white hover:bg-emerald-700"
        aria-label={locale === "zh" ? "\u6253\u5f00\u8d26\u53f7\u83dc\u5355" : "Open account menu"}
      >
        {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : initialFrom(nickname, email)}
      </button>

      {menuOpen ? (
        <div className="absolute right-0 top-12 z-50 w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
          <div className="border-b border-slate-100 px-3 py-2">
            <p className="truncate text-sm font-bold text-slate-900">{nickname || email}</p>
            <p className="mt-1 text-xs font-semibold text-emerald-700">{effectiveIsAdmin ? "\u7ba1\u7406\u5458" : "\u666e\u901a\u7528\u6237"}</p>
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
            {signingOut ? (locale === "zh" ? "\u9000\u51fa\u4e2d..." : "Signing out...") : locale === "zh" ? "\u9000\u51fa\u767b\u5f55" : "Sign out"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
