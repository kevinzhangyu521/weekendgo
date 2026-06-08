"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { getDestinationImage } from "@/features/destinations/images";
import {
  destinationAgeRange,
  destinationName,
  destinationRegion,
  destinationScenario
} from "@/features/destinations/presenter";
import type { DestinationItem } from "@/features/destinations/types";
import type { Locale } from "@/lib/i18n/config";

type RankingKey = "overall" | "creek" | "camping" | "youngKids";

type Props = {
  locale: Locale;
  homeCity: string;
  rankings: Record<RankingKey, DestinationItem[]>;
};

const rankingTabs: Array<{ key: RankingKey; labelZh: string; labelEn: string }> = [
  { key: "overall", labelZh: "综合榜", labelEn: "Overall" },
  { key: "creek", labelZh: "溯溪榜", labelEn: "Creek" },
  { key: "camping", labelZh: "露营榜", labelEn: "Camping" },
  { key: "youngKids", labelZh: "低龄儿童榜", labelEn: "Young kids" }
];

function pick(locale: Locale, en: string, zh: string) {
  return locale === "zh" ? zh : en;
}

function formatDistance(distanceKm: number, locale: Locale) {
  if (!distanceKm || distanceKm <= 0) return pick(locale, "Distance pending", "距离待计算");
  return `${distanceKm}km`;
}

function Top10Card({ item, locale, rank }: { item: DestinationItem; locale: Locale; rank: number }) {
  const image = getDestinationImage(item);
  const topOne = rank === 1;

  return (
    <Link
      href={`/destinations/${item.id}`}
      className="group block w-64 shrink-0 snap-start overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative h-32 overflow-hidden bg-slate-100">
        <img
          src={image.src}
          alt={destinationName(item, locale)}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <span className={`absolute left-2 top-2 rounded-full px-2.5 py-1 text-xs font-black text-white ${topOne ? "bg-rose-500" : "bg-slate-950/85"}`}>
          TOP {rank}
        </span>
        {topOne ? (
          <span className="absolute bottom-2 left-2 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-rose-600 shadow-sm">
            {pick(locale, "Top 1 pick", "TOP1推荐")}
          </span>
        ) : null}
        {image.pending ? (
          <span className="absolute right-2 top-2 rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
            {pick(locale, "Pending", "待补充")}
          </span>
        ) : null}
      </div>
      <div className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-sm font-bold text-slate-950">
            {destinationName(item, locale)}
          </h3>
          <span className="inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-amber-600">
            <Star className="h-3.5 w-3.5 fill-current" />
            {item.rating.toFixed(1)}
          </span>
        </div>
        <p className="line-clamp-1 text-xs text-slate-500">
          {destinationRegion(item, locale)} · {formatDistance(item.distanceKm, locale)}
        </p>
        <div className="flex flex-wrap gap-1.5 text-xs">
          <span className="rounded-full bg-emerald-50 px-2 py-1 font-medium text-emerald-700">{destinationScenario(item, locale)}</span>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">{destinationAgeRange(item, locale)}</span>
          {item.hasParking ? <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">可停车</span> : null}
        </div>
      </div>
    </Link>
  );
}

export function Top10Carousel({ locale, homeCity, rankings }: Props) {
  const [activeTab, setActiveTab] = useState<RankingKey>("overall");
  const [activeIndex, setActiveIndex] = useState(0);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef({ active: false, startX: 0, scrollLeft: 0 });
  const items = useMemo(() => rankings[activeTab] ?? rankings.overall, [activeTab, rankings]);

  function scrollByCard(direction: "prev" | "next") {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.scrollBy({ left: direction === "next" ? 320 : -320, behavior: "smooth" });
  }

  function updateActiveIndex() {
    const viewport = viewportRef.current;
    if (!viewport) return;
    setActiveIndex(Math.round(viewport.scrollLeft / 276));
  }

  return (
    <section id="top10" className="mx-auto mt-5 max-w-6xl scroll-mt-20 px-4">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-950">
            {pick(locale, `Top 10 family outings near ${homeCity}`, `本周${homeCity}TOP10遛娃地`)}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">{pick(locale, "Swipe, drag or use arrows to explore", "可滑动、拖拽或点击箭头查看")}</p>
        </div>
        <div className="hidden gap-2 md:flex">
          <button
            type="button"
            onClick={() => scrollByCard("prev")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
            aria-label={pick(locale, "Previous", "上一组")}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => scrollByCard("next")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
            aria-label={pick(locale, "Next", "下一组")}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {rankingTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              setActiveTab(tab.key);
              setActiveIndex(0);
              viewportRef.current?.scrollTo({ left: 0, behavior: "smooth" });
            }}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition ${
              activeTab === tab.key ? "bg-slate-950 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200"
            }`}
          >
            {pick(locale, tab.labelEn, tab.labelZh)}
          </button>
        ))}
      </div>

      <div
        ref={viewportRef}
        onScroll={updateActiveIndex}
        onWheel={(event) => {
          if (!viewportRef.current) return;
          event.preventDefault();
          viewportRef.current.scrollLeft += event.deltaY || event.deltaX;
        }}
        onMouseDown={(event) => {
          const viewport = viewportRef.current;
          if (!viewport) return;
          dragRef.current = { active: true, startX: event.pageX, scrollLeft: viewport.scrollLeft };
          viewport.classList.add("cursor-grabbing");
        }}
        onMouseMove={(event) => {
          const viewport = viewportRef.current;
          if (!viewport || !dragRef.current.active) return;
          event.preventDefault();
          const delta = event.pageX - dragRef.current.startX;
          viewport.scrollLeft = dragRef.current.scrollLeft - delta;
        }}
        onMouseUp={() => {
          dragRef.current.active = false;
          viewportRef.current?.classList.remove("cursor-grabbing");
        }}
        onMouseLeave={() => {
          dragRef.current.active = false;
          viewportRef.current?.classList.remove("cursor-grabbing");
        }}
        className="flex cursor-grab snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-2 select-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, index) => (
          <Top10Card key={`${activeTab}-${item.id}`} item={item} locale={locale} rank={index + 1} />
        ))}
      </div>

      <div className="mt-2 flex justify-center gap-1.5 md:hidden">
        {items.map((item, index) => (
          <span
            key={item.id}
            className={`h-1.5 rounded-full transition-all ${index === activeIndex ? "w-5 bg-emerald-600" : "w-1.5 bg-slate-300"}`}
          />
        ))}
      </div>
    </section>
  );
}
