"use client";

import dynamic from "next/dynamic";
import type { DestinationItem } from "@/features/destinations/types";
import type { Locale } from "@/lib/i18n/config";

const MapExplorer = dynamic(() => import("@/components/map/map-explorer").then((mod) => mod.MapExplorer), {
  ssr: false,
  loading: () => (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
      <div className="h-[70vh] rounded-xl border border-slate-200 bg-white p-4">
        <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      </div>
      <div className="flex h-[70vh] items-center justify-center rounded-xl border border-slate-200 bg-white text-sm text-slate-500">
        {"\u5730\u56fe\u52a0\u8f7d\u4e2d..."}
      </div>
    </div>
  )
});

type Props = {
  items: DestinationItem[];
  locale: Locale;
};

export function MapExplorerLoader({ items, locale }: Props) {
  return <MapExplorer items={items} locale={locale} />;
}
