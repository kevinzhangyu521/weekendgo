"use client";

import type { Locale } from "@/lib/i18n/config";

type Props = {
  locale: Locale;
};

export function LocaleSwitcher({ locale }: Props) {
  return (
    <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
      {"\u4e2d\u6587\u4f18\u5148"}
    </div>
  );
}
