import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
import { pick } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/config";

type Props = {
  locale: Locale;
  email: string | null;
  isAdmin: boolean;
};

export function AuthNav({ locale, email, isAdmin }: Props) {
  void isAdmin;
  const avatarLabel = email?.trim().slice(0, 1).toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="qmd-container flex h-[72px] items-center justify-between gap-6">
        <div className="flex min-w-0 items-center gap-8 text-sm">
          <BrandLogo />
          <nav className="scrollbar-none flex min-w-0 items-center gap-4 overflow-x-auto whitespace-nowrap text-slate-700 md:gap-6">
            <Link href="/destinations" className="interactive-nav-link shrink-0">
              {pick(locale, "Discover", "发现")}
            </Link>
            <Link href="/map" className="interactive-nav-link shrink-0">
              {pick(locale, "Map", "地图")}
            </Link>
            <Link href="/submit-spot" className="interactive-nav-link shrink-0">
              {pick(locale, "Submit", "投稿")}
            </Link>
          </nav>
        </div>

        {email ? (
          <Link href="/profile" aria-label={pick(locale, "Profile", "资料")} className="interactive-button flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-sm font-black text-white hover:bg-emerald-700">
            {avatarLabel}
          </Link>
        ) : (
          <Link href="/login" className="interactive-button inline-flex h-10 items-center justify-center rounded-full bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-700">
            {pick(locale, "Log in", "登录")}
          </Link>
        )}
      </div>
    </header>
  );
}
