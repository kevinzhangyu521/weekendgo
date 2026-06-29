"use client";

import { useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, MapPin, Star } from "lucide-react";
import { AmapNavigationButton } from "@/components/plans/amap-navigation-button";
import { DEFAULT_DESTINATION_IMAGE, getDestinationImage } from "@/features/destinations/images";
import {
  destinationDescription,
  destinationFamilyHighlight,
  destinationName
} from "@/features/destinations/presenter";
import type { DestinationItem, Scenario } from "@/features/destinations/types";
import type { Locale } from "@/lib/i18n/config";

type RankingKey = "overall" | "creek" | "camping" | "youngKids";

type Props = {
  locale: Locale;
  homeCity: string;
  rankings: Record<RankingKey, DestinationItem[]>;
  isSignedIn?: boolean;
};

const scenarioBadge: Record<Scenario, { en: string; zh: string }> = {
  camping: { en: "Camping pick", zh: "露营推荐" },
  creek: { en: "Water play", zh: "玩水推荐" },
  hiking: { en: "Family walk", zh: "亲子友好" },
  picnic: { en: "Weekend pick", zh: "周末精选" }
};

const scenarioTags: Record<Scenario, { en: string[]; zh: string[] }> = {
  camping: { en: ["Camping", "Family", "Photo"], zh: ["露营", "亲子", "拍照"] },
  creek: { en: ["Creek", "Water", "Family"], zh: ["溯溪", "玩水", "亲子"] },
  hiking: { en: ["Hiking", "Walk", "Family"], zh: ["徒步", "遛娃", "亲子"] },
  picnic: { en: ["Picnic", "Cycling", "Photo"], zh: ["野餐", "骑行", "拍照"] }
};

const allowedPlayTagsZh = new Set(["玩水", "溯溪", "露营", "野餐", "骑行", "徒步", "遛娃", "拍照", "亲子"]);
const blockedTagWords = ["停车", "厕所", "门票", "免费", "现场", "0-3", "3-6", "6-12", "12岁", "适合年龄"];

function pick(locale: Locale, en: string, zh: string) {
  return locale === "zh" ? zh : en;
}

function trimText(text: string, maxLength: number) {
  const clean = text.replace(/\s+/g, " ").trim();
  const chars = Array.from(clean);
  return chars.length > maxLength ? `${chars.slice(0, maxLength).join("")}...` : clean;
}

function formatKm(distanceKm: number) {
  return Number.isInteger(distanceKm) ? `${distanceKm}` : distanceKm.toFixed(1);
}

function estimateDriveTime(distanceKm: number, locale: Locale) {
  const minutes = Math.max(15, Math.round((distanceKm / 45) * 60 / 5) * 5);
  if (minutes < 60) return pick(locale, `about ${minutes} min`, `约${minutes}分钟`);
  const hours = Math.round((minutes / 60) * 10) / 10;
  return pick(locale, `about ${hours} h`, `约${hours}小时`);
}

function distanceLine(item: DestinationItem, homeCity: string, locale: Locale) {
  if (!item.distanceKm || item.distanceKm <= 0) {
    return pick(locale, "Around Wuhan · Check navigation", "武汉周边 · 车程以导航为准");
  }

  const driveTime = item.driveTime || estimateDriveTime(item.distanceKm, locale);
  return pick(
    locale,
    `About ${formatKm(item.distanceKm)} km from ${homeCity} · ${driveTime}`,
    `距${homeCity}约${formatKm(item.distanceKm)}公里 · ${driveTime}`
  );
}

function recommendationBadge(item: DestinationItem, rank: number, locale: Locale) {
  const customBadge = item.badgeText?.trim();
  if (customBadge && !/^top\s*\d+$/i.test(customBadge)) return customBadge;
  if (rank === 1) return pick(locale, "Hot this week", "本周热门");
  return locale === "zh" ? scenarioBadge[item.scenario].zh : scenarioBadge[item.scenario].en;
}

function normalizePlayTag(tag: string) {
  const clean = tag.trim();
  if (allowedPlayTagsZh.has(clean)) return clean;
  for (const allowed of allowedPlayTagsZh) {
    if (clean.includes(allowed)) return allowed;
  }
  return clean;
}

function playTags(item: DestinationItem, locale: Locale) {
  if (locale !== "zh") return scenarioTags[item.scenario].en.slice(0, 3);

  const candidates = [...scenarioTags[item.scenario].zh, ...(item.tags ?? [])]
    .map(normalizePlayTag)
    .filter((tag) => allowedPlayTagsZh.has(tag))
    .filter((tag) => !blockedTagWords.some((word) => tag.includes(word)));

  return Array.from(new Set(candidates)).slice(0, 3);
}

function shortReason(item: DestinationItem, locale: Locale) {
  const name = destinationName(item, "zh");
  const knownReasons: Array<[string, string]> = [
    ["东湖绿道", "市区内轻松遛娃，骑行和野餐都方便。"],
    ["木兰草原", "第一次带孩子露营，这里更稳妥。"],
    ["后官湖", "适合想安静散步和骑行的家庭。"],
    ["木兰天池", "山水峡谷路线，适合轻松玩水。"]
  ];

  if (locale === "zh") {
    const matched = knownReasons.find(([keyword]) => name.includes(keyword));
    if (matched) return matched[1];
  }

  const source = destinationFamilyHighlight(item, locale) || destinationDescription(item, locale);
  return trimText(source, locale === "zh" ? 36 : 88);
}

function ratingText(item: DestinationItem, locale: Locale) {
  if (typeof item.rating === "number" && item.rating > 0) return item.rating.toFixed(1);
  return pick(locale, "No rating", "暂无评价");
}

function RecommendationCard({
  item,
  locale,
  homeCity,
  rank,
  isSignedIn
}: {
  item: DestinationItem;
  locale: Locale;
  homeCity: string;
  rank: number;
  isSignedIn: boolean;
}) {
  const router = useRouter();
  const image = getDestinationImage(item);
  const name = destinationName(item, locale);
  const detailHref = `/destinations/${item.id}`;
  const navigationLabel = pick(locale, "Navigate", "立即导航");
  const tags = playTags(item, locale);

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={() => router.push(detailHref)}
      onKeyDown={(event) => {
        if (event.key === "Enter") router.push(detailHref);
      }}
      className="interactive-card flex h-full shrink-0 snap-start basis-[88%] cursor-pointer flex-col overflow-hidden rounded-[22px] border border-slate-100 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.06)] sm:basis-[calc(50%_-_8px)] lg:basis-[calc(33.333%_-_11px)]"
    >
      <Link
        href={detailHref}
        onClick={(event) => event.stopPropagation()}
        className="relative block aspect-[4/3] w-full overflow-hidden rounded-t-[22px] bg-slate-100"
      >
        <img
          src={image.src}
          alt={name}
          loading={rank <= 3 ? "eager" : "lazy"}
          fetchPriority={rank <= 3 ? "high" : "auto"}
          decoding="async"
          referrerPolicy="no-referrer"
          onError={(event) => {
            const img = event.currentTarget;
            if (img.dataset.fallbackApplied === "true") return;
            img.dataset.fallbackApplied = "true";
            img.src = DEFAULT_DESTINATION_IMAGE;
          }}
          className="interactive-image h-full w-full object-cover"
        />
        <div className="absolute left-4 top-4">
          <span className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm">
            {recommendationBadge(item, rank, locale)}
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col px-[22px] py-5">
        <div className="space-y-2.5">
          <Link
            href={detailHref}
            onClick={(event) => event.stopPropagation()}
            className="interactive-text-link line-clamp-1 text-xl font-black text-slate-950"
          >
            {name}
          </Link>

          <p className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
            <MapPin className="h-4 w-4 shrink-0 text-emerald-700" />
            <span className="line-clamp-1">{distanceLine(item, homeCity, locale)}</span>
          </p>

          <p className="line-clamp-2 min-h-10 text-sm leading-5 text-slate-700">{shortReason(item, locale)}</p>
        </div>

        <div className="mt-4 flex min-h-8 flex-wrap gap-1.5">
          {tags.map((tag, index) => (
            <span
              key={`${item.id}-${tag}-${index}`}
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                index % 2 === 0 ? "bg-emerald-50 text-emerald-700" : "bg-sky-50 text-sky-700"
              }`}
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-auto border-t border-slate-100 pt-4">
          <Link
            href={`${detailHref}#reviews`}
            onClick={(event) => event.stopPropagation()}
            className="interactive-text-link mb-4 inline-flex items-center gap-1 text-sm font-semibold text-slate-700"
            aria-label={pick(locale, "View reviews", "查看评价")}
          >
            <Star className="h-4 w-4 fill-current text-amber-500" />
            <span>{ratingText(item, locale)}</span>
            <span className="sr-only">{pick(locale, "reviews", "评价")}</span>
          </Link>

          <div className="grid grid-cols-2 gap-2">
            <Link
              href={detailHref}
              onClick={(event) => event.stopPropagation()}
              className="interactive-button inline-flex h-[46px] items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              {pick(locale, "Details", "查看详情")}
            </Link>
            <div onClick={(event) => event.stopPropagation()}>
              <AmapNavigationButton
                destination={item}
                label={navigationLabel}
                className="h-[46px] w-full rounded-xl px-3 text-sm font-bold"
                isSignedIn={isSignedIn}
                loginHref={`/login?next=${encodeURIComponent(detailHref)}`}
                signedOutLabel={navigationLabel}
              />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export function Top10Carousel({ locale, homeCity, rankings, isSignedIn = false }: Props) {
  const items = rankings.overall ?? [];
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef({ active: false, startX: 0, scrollLeft: 0 });

  function scrollByCard(direction: "prev" | "next") {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.scrollBy({ left: direction === "next" ? viewport.clientWidth : -viewport.clientWidth, behavior: "smooth" });
  }

  return (
    <section id="top10" className="mx-auto mt-5 max-w-6xl scroll-mt-20 px-4">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-950">
            {pick(locale, `Top family places near ${homeCity}`, `本周${homeCity}TOP10推荐地点`)}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {pick(locale, "Swipe to discover places worth opening this weekend.", "首页先种草，完整信息放在详情页。")}
          </p>
        </div>
        <div className="hidden shrink-0 gap-2 md:flex">
          <button
            type="button"
            onClick={() => scrollByCard("prev")}
            className="interactive-button inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
            aria-label={pick(locale, "Previous", "上一组")}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => scrollByCard("next")}
            className="interactive-button inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
            aria-label={pick(locale, "Next", "下一组")}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        ref={viewportRef}
        onWheel={(event) => {
          if (!viewportRef.current) return;
          if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
          event.preventDefault();
          viewportRef.current.scrollLeft += event.deltaY;
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
          viewport.scrollLeft = dragRef.current.scrollLeft - (event.pageX - dragRef.current.startX);
        }}
        onMouseUp={() => {
          dragRef.current.active = false;
          viewportRef.current?.classList.remove("cursor-grabbing");
        }}
        onMouseLeave={() => {
          dragRef.current.active = false;
          viewportRef.current?.classList.remove("cursor-grabbing");
        }}
        className="flex cursor-grab snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-3 select-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, index) => (
          <RecommendationCard key={item.id} item={item} locale={locale} homeCity={homeCity} rank={index + 1} isSignedIn={isSignedIn} />
        ))}
      </div>
    </section>
  );
}
