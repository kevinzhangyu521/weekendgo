"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/config";

type Props = {
  locale: Locale;
};

const links: Record<Locale, Array<{ href: string; label: string }>> = {
  zh: [
    { href: "/destinations", label: "发现" },
    { href: "/map", label: "地图" },
    { href: "/submit-spot", label: "投稿" }
  ],
  en: [
    { href: "/destinations", label: "Discover" },
    { href: "/map", label: "Map" },
    { href: "/submit-spot", label: "Submit" }
  ]
};

export function HeaderMobileMenu({ locale }: Props) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  return (
    <div ref={menuRef} className="relative md:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="interactive-button inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700"
        aria-label={locale === "zh" ? "打开导航菜单" : "Open navigation menu"}
        aria-expanded={open}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-50 w-40 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
          {links[locale].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
