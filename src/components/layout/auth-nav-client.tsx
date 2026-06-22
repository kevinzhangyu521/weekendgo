"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { createClient } from "@/lib/supabase/client";

type Props = {
  locale: Locale;
  initialEmail: string | null;
  initialIsAdmin: boolean;
};

type NavItem = {
  href: string;
  label: string;
  authOnly?: boolean;
  adminOnly?: boolean;
};

const navItems: Record<Locale, NavItem[]> = {
  zh: [
    { href: "/destinations", label: "\u76ee\u7684\u5730" },
    { href: "/map", label: "\u5730\u56fe" },
    { href: "/favorites", label: "\u6536\u85cf", authOnly: true },
    { href: "/plans", label: "\u6211\u7684\u8ba1\u5212", authOnly: true },
    { href: "/submit-spot", label: "\u6dfb\u52a0\u5730\u70b9", authOnly: true },
    { href: "/my-submissions", label: "\u6211\u7684\u6295\u7a3f", authOnly: true },
    { href: "/profile", label: "\u6211\u7684\u8d44\u6599", authOnly: true },
    { href: "/admin/collections", label: "\u91c7\u96c6", adminOnly: true },
    { href: "/admin/feedback", label: "反馈", adminOnly: true },
    { href: "/admin/submissions", label: "\u5ba1\u6838", adminOnly: true },
    { href: "/admin/destinations", label: "\u5730\u70b9\u7ba1\u7406", adminOnly: true },
    { href: "/admin/settings", label: "\u7ba1\u7406\u8bbe\u7f6e", adminOnly: true }
  ],
  en: [
    { href: "/destinations", label: "Destinations" },
    { href: "/map", label: "Map" },
    { href: "/favorites", label: "Favorites", authOnly: true },
    { href: "/plans", label: "My Plans", authOnly: true },
    { href: "/submit-spot", label: "Add", authOnly: true },
    { href: "/my-submissions", label: "My Submissions", authOnly: true },
    { href: "/profile", label: "Profile", authOnly: true },
    { href: "/admin/collections", label: "Collect", adminOnly: true },
    { href: "/admin/feedback", label: "Feedback", adminOnly: true },
    { href: "/admin/submissions", label: "Review", adminOnly: true },
    { href: "/admin/destinations", label: "Manage", adminOnly: true },
    { href: "/admin/settings", label: "Settings", adminOnly: true }
  ]
};

export function AuthNavClient({ locale, initialIsAdmin }: Props) {
  const pathname = usePathname();
  const currentUser = useCurrentUser();
  const email = currentUser.isAuthenticated ? currentUser.email : null;
  const [clientIsAdmin, setClientIsAdmin] = useState(initialIsAdmin);
  const isAdmin = Boolean(email) && clientIsAdmin;
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadAdminStatus() {
      if (currentUser.isLoading) return;
      if (!currentUser.isAuthenticated) {
        setClientIsAdmin(false);
        return;
      }

      const supabase = createClient();
      const {
        data: { session }
      } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;

      try {
        const response = await fetch("/api/admin/me", {
          headers,
          credentials: "include",
          cache: "no-store"
        });
        const result = (await response.json()) as { isAdmin?: boolean };
        if (mounted) setClientIsAdmin(Boolean(result.isAdmin));
      } catch {
        if (mounted) setClientIsAdmin(false);
      }
    }

    void loadAdminStatus();

    return () => {
      mounted = false;
    };
  }, [currentUser.isAuthenticated, currentUser.isLoading]);

  async function handleSignOut() {
    setLoading(true);
    setMenuOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.assign("/");
  }

  const visibleItems = navItems[locale].filter((item) => {
    if (item.adminOnly) return isAdmin;
    if (item.authOnly) return Boolean(email);
    return true;
  });

  const loginHref = `/login?next=${encodeURIComponent(pathname || "/")}`;
  const accountItems = visibleItems.filter((item) => item.authOnly && !item.adminOnly);
  const adminItems = visibleItems.filter((item) => item.adminOnly);
  const menuItems = visibleItems.filter((item) => item.authOnly || item.adminOnly);

  return (
    <div className="flex items-center gap-2 text-sm">
      {menuItems.length > 0 ? (
        <button
          type="button"
          onClick={() => setMenuOpen((value) => !value)}
          className="interactive-button inline-flex items-center justify-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50"
          aria-label={menuOpen ? "\u5173\u95ed\u83dc\u5355" : "\u6253\u5f00\u83dc\u5355"}
        >
          <span className="hidden md:inline">{locale === "zh" ? "菜单" : "Menu"}</span>
          <span className="md:hidden">{menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}</span>
          <ChevronDown className={`hidden h-4 w-4 transition md:block ${menuOpen ? "rotate-180" : ""}`} />
        </button>
      ) : null}

      {email ? (
        <div className="flex items-center gap-2">
          <span className="hidden max-w-[180px] truncate text-slate-600 md:inline">{email}</span>
          <button
            type="button"
            onClick={handleSignOut}
            className={`interactive-button rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50 ${
              loading ? "pointer-events-none opacity-60" : ""
            }`}
          >
            {loading ? (locale === "zh" ? "\u9000\u51fa\u4e2d..." : "Signing out...") : locale === "zh" ? "\u9000\u51fa" : "Sign out"}
          </button>
        </div>
      ) : (
        <Link href={loginHref} className="interactive-button rounded-full bg-emerald-600 px-3 py-1.5 font-medium text-white hover:bg-emerald-700">
          {locale === "zh" ? "\u767b\u5f55" : "Sign in"}
        </Link>
      )}

      {menuOpen ? (
        <div className="fixed inset-x-4 top-16 z-50 rounded-xl border border-slate-200 bg-white p-3 shadow-xl md:inset-x-auto md:right-6 md:w-72">
          <div className="grid gap-1 md:hidden">
            {visibleItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`interactive-button rounded-lg px-3 py-2 text-sm ${
                  pathname === item.href ? "bg-emerald-50 font-semibold text-emerald-700" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="hidden gap-3 md:grid">
            {accountItems.length > 0 ? (
              <div>
                <p className="px-3 pb-1 text-xs font-semibold text-slate-400">{locale === "zh" ? "我的功能" : "My tools"}</p>
                <div className="grid gap-1">
                  {accountItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={`interactive-button rounded-lg px-3 py-2 text-sm ${
                        pathname === item.href ? "bg-emerald-50 font-semibold text-emerald-700" : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
            {adminItems.length > 0 ? (
              <div className={accountItems.length > 0 ? "border-t border-slate-100 pt-3" : ""}>
                <p className="px-3 pb-1 text-xs font-semibold text-emerald-700">{locale === "zh" ? "管理员" : "Admin"}</p>
                <div className="grid gap-1">
                  {adminItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={`interactive-button rounded-lg px-3 py-2 text-sm ${
                        pathname === item.href ? "bg-emerald-50 font-semibold text-emerald-700" : "font-medium text-emerald-700 hover:bg-emerald-50"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          {email ? (
            <div className="mt-3 border-t border-slate-100 pt-3">
              <p className="truncate px-3 text-xs text-slate-500">{email}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
