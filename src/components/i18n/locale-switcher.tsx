"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";

type Props = {
  locale: Locale;
};

export function LocaleSwitcher({ locale }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function setLocale(nextLocale: Locale) {
    if (nextLocale === locale || pending) return;
    setPending(true);
    await fetch("/api/locale", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ locale: nextLocale })
    });
    router.refresh();
    setPending(false);
  }

  return (
    <div className="inline-flex items-center rounded-full border border-slate-200 bg-white p-0.5 text-xs">
      <button
        type="button"
        onClick={() => setLocale("zh")}
        disabled={pending}
        className={`rounded-full px-2 py-1 ${locale === "zh" ? "bg-slate-900 text-white" : "text-slate-700"}`}
      >
        中文
      </button>
      <button
        type="button"
        onClick={() => setLocale("en")}
        disabled={pending}
        className={`rounded-full px-2 py-1 ${locale === "en" ? "bg-slate-900 text-white" : "text-slate-700"}`}
      >
        EN
      </button>
    </div>
  );
}
