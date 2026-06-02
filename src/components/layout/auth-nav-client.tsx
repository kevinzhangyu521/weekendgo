"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Locale } from "@/lib/i18n/config";

type Props = {
  locale: Locale;
  initialEmail: string | null;
};

export function AuthNavClient({ locale, initialEmail }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState<string | null>(initialEmail);
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    await supabase.auth.signOut();
    setEmail(null);
    setLoading(false);
    router.refresh();
  }

  if (email) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="hidden max-w-[220px] truncate text-slate-600 md:inline">{email}</span>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={loading}
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {locale === "zh" ? "退出" : "Sign out"}
        </button>
      </div>
    );
  }

  return (
    <Link
      href={`/login?next=${encodeURIComponent(pathname || "/")}`}
      className="rounded-full bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
    >
      {locale === "zh" ? "登录" : "Sign in"}
    </Link>
  );
}
