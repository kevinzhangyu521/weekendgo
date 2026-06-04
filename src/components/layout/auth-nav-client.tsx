"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Menu, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Locale } from "@/lib/i18n/config";

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
    { href: "/destinations", label: "目的地" },
    { href: "/map", label: "地图" },
    { href: "/favorites", label: "收藏" },
    { href: "/plans", label: "我的计划" },
    { href: "/submit-spot", label: "添加推荐地点" },
    { href: "/my-submissions", label: "我的投稿", authOnly: true },
    { href: "/profile", label: "我的资料", authOnly: true },
    { href: "/admin/submissions", label: "审核投稿", adminOnly: true },
    { href: "/admin/destinations", label: "目的地管理", adminOnly: true }
  ],
  en: [
    { href: "/destinations", label: "Destinations" },
    { href: "/map", label: "Map" },
    { href: "/favorites", label: "Favorites" },
    { href: "/plans", label: "My Plans" },
    { href: "/submit-spot", label: "Add Spot" },
    { href: "/my-submissions", label: "My Submissions", authOnly: true },
    { href: "/profile", label: "Profile", authOnly: true },
    { href: "/admin/submissions", label: "Review", adminOnly: true },
    { href: "/admin/destinations", label: "Destination Admin", adminOnly: true }
  ]
};

export function AuthNavClient({ locale, initialEmail, initialIsAdmin }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState<string | null>(initialEmail);
  const [isAdmin, setIsAdmin] = useState(initialIsAdmin);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  async function syncSession() {
    const {
      data: { user }
    } = await supabase.auth.getUser();

    setEmail(user?.email ?? null);

    if (!user) {
      setIsAdmin(false);
      return;
    }

    const { data } = await supabase.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
    setIsAdmin(Boolean(data));
  }

  useEffect(() => {
    void syncSession();
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event) => {
      void syncSession();
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") router.refresh();
    });

    return () => subscription.unsubscribe();
  }, [router, supabase]);

  async function handleSignOut() {
    setLoading(true);
    await supabase.auth.signOut();
    setEmail(null);
    setIsAdmin(false);
    setMenuOpen(false);
    setLoading(false);
    router.refresh();
  }

  const visibleItems = navItems[locale].filter((item) => {
    if (item.adminOnly) return isAdmin;
    if (item.authOnly) return Boolean(email);
    return true;
  });

  const loginHref = `/login?next=${encodeURIComponent(pathname || "/")}`;

  return (
    <div className="flex items-center gap-2 text-sm">
      <button
        type="button"
        onClick={() => setMenuOpen((value) => !value)}
        className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white p-2 text-slate-700 md:hidden"
        aria-label={menuOpen ? "关闭菜单" : "打开菜单"}
      >
        {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      {email ? (
        <div className="flex items-center gap-2">
          <span className="hidden max-w-[220px] truncate text-slate-600 md:inline">{email}</span>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={loading}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {locale === "zh" ? "退出" : "Sign out"}
          </button>
        </div>
      ) : (
        <Link
          href={loginHref}
          className="rounded-full bg-emerald-600 px-3 py-1.5 font-medium text-white hover:bg-emerald-700"
        >
          {locale === "zh" ? "登录" : "Sign in"}
        </Link>
      )}

      {menuOpen ? (
        <div className="fixed inset-x-4 top-16 z-50 rounded-xl border border-slate-200 bg-white p-3 shadow-xl md:hidden">
          <div className="grid gap-1">
            {visibleItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`rounded-lg px-3 py-2 text-sm ${
                  pathname === item.href ? "bg-emerald-50 font-semibold text-emerald-700" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {item.label}
              </Link>
            ))}
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
