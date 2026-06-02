import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getLocale, pick } from "@/lib/i18n/server";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { AuthNavClient } from "./auth-nav-client";

export async function AuthNav() {
  const locale = await getLocale();
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center gap-4 text-sm">
          <Link href="/" className="font-semibold text-slate-900">
            WeekendGo
          </Link>
          <nav className="hidden items-center gap-3 text-slate-600 md:flex">
            <Link href="/destinations" className="hover:text-slate-900">
              {pick(locale, "Destinations", "\u76ee\u7684\u5730")}
            </Link>
            <Link href="/map" className="hover:text-slate-900">
              {pick(locale, "Map", "\u5730\u56fe")}
            </Link>
            <Link href="/favorites" className="hover:text-slate-900">
              {pick(locale, "Favorites", "\u6536\u85cf")}
            </Link>
            <Link href="/plans" className="hover:text-slate-900">
              {pick(locale, "Plans", "\u8ba1\u5212")}
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <LocaleSwitcher locale={locale} />
          <AuthNavClient locale={locale} initialEmail={user?.email ?? null} />
        </div>
      </div>
    </header>
  );
}
