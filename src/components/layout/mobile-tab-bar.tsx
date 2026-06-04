"use client";

import Link from "next/link";
import { Heart, Home, MapPinned, Route, User } from "lucide-react";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";

type Props = {
  locale: Locale;
  isSignedIn: boolean;
};

const labels = {
  zh: {
    home: "首页",
    destinations: "目的地",
    map: "地图",
    plans: "计划",
    mine: "我的"
  },
  en: {
    home: "Home",
    destinations: "Places",
    map: "Map",
    plans: "Plans",
    mine: "Me"
  }
};

export function MobileTabBar({ locale, isSignedIn }: Props) {
  const pathname = usePathname();
  const text = labels[locale];
  const mineHref = isSignedIn ? "/profile" : `/login?next=${encodeURIComponent(pathname || "/")}`;

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
