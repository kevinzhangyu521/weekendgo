import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
import { pick } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/config";
import { HeaderAccountMenu } from "./header-account-menu";
import { HeaderMobileMenu } from "./header-mobile-menu";

type Props = {
  locale: Locale;
  email: string | null;
  isAdmin: boolean;
};

export function AuthNav({ locale, email, isAdmin }: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="qmd-container flex h-[72px] items-center justify-between gap-6">
        <div className="flex min-w-0 items-center gap-8 text-sm">
          <BrandLogo />
          <nav className="hidden min-w-0 items-center gap-6 whitespace-nowrap text-slate-700 md:flex">
            <Link href="/destinations" className="interactive-nav-link shrink-0">
              {pick(locale, "发现", "\u53d1\u73b0")}
            </Link>
            <Link href="/map" className="interactive-nav-link shrink-0">
              {pick(locale, "地图", "\u5730\u56fe")}
            </Link>
            <Link href="/submit-spot" className="interactive-nav-link shrink-0">
              {pick(locale, "投稿", "\u6295\u7a3f")}
            </Link>
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <HeaderMobileMenu locale={locale} />
          <HeaderAccountMenu locale={locale} initialEmail={email} isAdmin={isAdmin} />
        </div>
      </div>
    </header>
  );
}
