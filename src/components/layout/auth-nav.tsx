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
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-4 text-sm">
          <BrandLogo />
          <nav className="hidden min-w-0 flex-1 items-center gap-3 overflow-x-auto whitespace-nowrap text-slate-600 md:flex">
            <Link href="/destinations" className="shrink-0 hover:text-slate-900">
              {pick(locale, "Destinations", "\u76ee\u7684\u5730")}
            </Link>
            <Link href="/map" className="shrink-0 hover:text-slate-900">
              {pick(locale, "Map", "\u5730\u56fe")}
            </Link>
            <Link href="/favorites" className="shrink-0 hover:text-slate-900">
              {pick(locale, "Favorites", "\u6536\u85cf")}
            </Link>
            <Link href="/plans" className="shrink-0 hover:text-slate-900">
              {pick(locale, "My Plans", "\u6211\u7684\u8ba1\u5212")}
            </Link>
            <Link href="/submit-spot" className="shrink-0 hover:text-slate-900">
              {pick(locale, "Add Spot", "\u6dfb\u52a0\u63a8\u8350\u5730\u70b9")}
            </Link>
            {email ? (
              <Link href="/my-submissions" className="shrink-0 hover:text-slate-900">
                {pick(locale, "My Submissions", "\u6211\u7684\u6295\u7a3f")}
              </Link>
            ) : null}
            {email ? (
              <Link href="/profile" className="shrink-0 hover:text-slate-900">
                {"\u6211\u7684\u8d44\u6599"}
              </Link>
            ) : null}
            {isAdmin ? (
              <>
                <Link href="/admin/submissions" className="shrink-0 font-medium text-emerald-700 hover:text-emerald-800">
                  {pick(locale, "Review", "\u5ba1\u6838\u6295\u7a3f")}
                </Link>
                <Link href="/admin/destinations" className="shrink-0 font-medium text-emerald-700 hover:text-emerald-800">
                  {"\u76ee\u7684\u5730\u7ba1\u7406"}
                </Link>
                <Link href="/admin/settings" className="shrink-0 font-medium text-emerald-700 hover:text-emerald-800">
                  {"\u7ba1\u7406\u5458\u8bbe\u7f6e"}
                </Link>
              </>
            ) : null}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <LocaleSwitcher locale={locale} />
          <AuthNavClient locale={locale} initialEmail={email} initialIsAdmin={isAdmin} />
        </div>
      </div>
    </header>
  );
}
