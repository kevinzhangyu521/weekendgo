"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Heart, Home, MapPinned, Route, User } from "lucide-react";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { createClient } from "@/lib/supabase/client";

type Props = {
  locale: Locale;
  isSignedIn: boolean;
};

const labels = {
  zh: {
    home: "\u9996\u9875",
    destinations: "\u76ee\u7684\u5730",
    map: "\u5730\u56fe",
    plans: "\u6211\u7684\u8ba1\u5212",
    mine: "\u6211\u7684"
  },
  en: {
    home: "Home",
    destinations: "Places",
    map: "Map",
    plans: "My Plans",
    mine: "Me"
  }
};

export function MobileTabBar({ locale, isSignedIn }: Props) {
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);
  const [signedIn, setSignedIn] = useState(isSignedIn);
  const text = labels[locale];

  useEffect(() => {
    let mounted = true;
    const cachedEmail = window.localStorage.getItem("qimeide_auth_email");
    if (cachedEmail) setSignedIn(true);

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const user = data.session?.user ?? null;
      if (user?.email) {
        setSignedIn(true);
        window.localStorage.setItem("qimeide_auth_email", user.email);
      }
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user ?? null;
      if (user?.email) {
        setSignedIn(true);
        window.localStorage.setItem("qimeide_auth_email", user.email);
      } else if (event === "SIGNED_OUT") {
        setSignedIn(false);
        window.localStorage.removeItem("qimeide_auth_email");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const mineHref = signedIn ? "/profile" : `/login?next=${encodeURIComponent(pathname || "/")}`;

  const items = [
    { href: "/", label: text.home, icon: Home },
    { href: "/destinations", label: text.destinations, icon: Heart },
    { href: "/map", label: text.map, icon: MapPinned },
    { href: "/plans", label: text.plans, icon: Route },
    { href: mineHref, label: text.mine, icon: User }
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
      <div className="grid grid-cols-5">
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href.split("?")[0]);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] ${
                active ? "font-semibold text-emerald-700" : "text-slate-500"
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
