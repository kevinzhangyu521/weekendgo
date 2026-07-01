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
  void isAdmin;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="qmd-container flex h-[72px] items-center justify-between gap-6">
        <div className="flex min-w-0 items-center gap-8 text-sm">
          <BrandLogo />
          <nav className="hidden min-w-0 items-center gap-6 whitespace-nowrap text-slate-700 md:flex">
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

        <div className="flex shrink-0 items-center gap-2">
          <HeaderMobileMenu locale={locale} />
          <HeaderAccountMenu locale={locale} initialEmail={email} />
        </div>
      </div>
    </header>
  );
}
