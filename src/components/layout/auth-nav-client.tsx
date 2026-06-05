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
    { href: "/destinations", label: "\u76ee\u7684\u5730" },
    { href: "/map", label: "\u5730\u56fe" },
    { href: "/favorites", label: "\u6536\u85cf" },
    { href: "/plans", label: "\u6211\u7684\u8ba1\u5212" },
    { href: "/submit-spot", label: "\u6dfb\u52a0\u63a8\u8350\u5730\u70b9" },
    { href: "/my-submissions", label: "\u6211\u7684\u6295\u7a3f", authOnly: true },
    { href: "/profile", label: "\u6211\u7684\u8d44\u6599", authOnly: true },
    { href: "/admin/submissions", label: "\u5ba1\u6838\u6295\u7a3f", adminOnly: true },
    { href: "/admin/destinations", label: "\u76ee\u7684\u5730\u7ba1\u7406", adminOnly: true }
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

  useEffect(() => {
    let mounted = true;

    const cachedEmail = window.localStorage.getItem("qimeide_auth_email");
    if (cachedEmail) setEmail(cachedEmail);

    async function updateFromSession(userId?: string, userEmail?: string | null) {
      if (!mounted) return;
      setEmail(userEmail ?? null);

      if (!userId) {
        window.localStorage.removeItem("qimeide_auth_email");
        setIsAdmin(false);
        return;
      }

      if (userEmail) window.localStorage.setItem("qimeide_auth_email", userEmail);
      const { data } = await supabase.from("admin_users").select("user_id").eq("user_id", userId).maybeSingle();
      if (mounted) setIsAdmin(Boolean(data));
    }

    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user ?? null;
      void updateFromSession(user?.id, user?.email ?? null);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user ?? null;
      await updateFromSession(user?.id, user?.email ?? null);

      if (event === "SIGNED_IN" || event === "SIGNED_OUT") router.refresh();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  function prepareSignOut() {
    setLoading(true);
    setMenuOpen(false);
    setEmail(null);
    setIsAdmin(false);
    window.localStorage.removeItem("qimeide_auth_email");
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
        aria-label={menuOpen ? "\u5173\u95ed\u83dc\u5355" : "\u6253\u5f00\u83dc\u5355"}
      >
        {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      {email ? (
        <div className="flex items-center gap-2">
          <span className="hidden max-w-[220px] truncate text-slate-600 md:inline">{email}</span>
          <Link
            href="/auth/sign-out"
            onClick={prepareSignOut}
            className={`rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50 ${
              loading ? "pointer-events-none opacity-60" : ""
            }`}
          >
            {loading ? (locale === "zh" ? "\u9000\u51fa\u4e2d..." : "Signing out...") : locale === "zh" ? "\u9000\u51fa" : "Sign out"}
          </Link>
        </div>
      ) : (
        <Link href={loginHref} className="rounded-full bg-emerald-600 px-3 py-1.5 font-medium text-white hover:bg-emerald-700">
          {locale === "zh" ? "\u767b\u5f55" : "Sign in"}
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
