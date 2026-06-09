import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
import { pick } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/config";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { AuthNavClient } from "./auth-nav-client";

type Props = {
  locale: Locale;
  email: string | null;
  isAdmin: boolean;
};

export function AuthNav({ locale, email, isAdmin }: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-4 text-sm">
          <BrandLogo />
          <nav className="scrollbar-none hidden min-w-0 flex-1 items-center gap-3 overflow-x-auto whitespace-nowrap text-slate-600 md:flex">
            <Link href="/destinations" className="shrink-0 hover:text-slate-900">
              {pick(locale, "Destinations", "\u76ee\u7684\u5730")}
            </Link>
            <Link href="/map" className="shrink-0 hover:text-slate-900">
              {pick(locale, "Map", "\u5730\u56fe")}
            </Link>
          </nav>
        </div>

        <div className="flex min-w-0 shrink-0 items-center gap-2">
          <LocaleSwitcher locale={locale} />
          <AuthNavClient locale={locale} initialEmail={email} initialIsAdmin={isAdmin} />
        </div>
      </div>
    </header>
  );
}
