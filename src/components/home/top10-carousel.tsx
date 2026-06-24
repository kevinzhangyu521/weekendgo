"use client";

import { useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bath, Car, ChevronLeft, ChevronRight, MapPin, Star, Ticket, Users } from "lucide-react";
import { AmapNavigationButton } from "@/components/plans/amap-navigation-button";
import { DEFAULT_DESTINATION_IMAGE, getDestinationImage } from "@/features/destinations/images";
import {
  destinationAgeRange,
  destinationDescription,
  destinationName,
  destinationRegion,
  destinationScenario
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

const scenarioBadge: Record<Scenario, string> = {
  camping: "露营圣地",
  creek: "玩水好去处",
  hiking: "亲子徒步",
  picnic: "热门推荐"
};

const scenarioTags: Record<Scenario, string[]> = {
  camping: ["露营", "遛娃", "草地"],
  creek: ["溯溪", "玩水", "避暑"],
  hiking: ["徒步", "散步", "观景"],
  picnic: ["野餐", "遛娃", "拍照"]
};

function pick(locale: Locale, en: string, zh: string) {
  return locale === "zh" ? zh : en;
}

function formatDistance(distanceKm: number, homeCity: string, locale: Locale) {
  if (!distanceKm || distanceKm <= 0) return pick(locale, "Distance pending", "距离待计算");
  return pick(locale, `About ${distanceKm}km from ${homeCity}`, `距${homeCity}约${distanceKm}公里`);
}

function ticketText(item: DestinationItem, locale: Locale) {
  if (item.ticketPrice) return item.ticketPrice;
  if (item.scenario === "picnic") return pick(locale, "Check locally", "以现场为准");
  return pick(locale, "Check official price", "以景区为准");
}

function parkingText(item: DestinationItem, locale: Locale) {
  if (item.parkingInfo) return item.parkingInfo;
  return item.hasParking ? pick(locale, "Available", "可停车") : pick(locale, "Limited", "停车少");
}

function toiletText(item: DestinationItem, locale: Locale) {
  if (item.toiletInfo) return item.toiletInfo;
  return item.hasToilet ? pick(locale, "Available", "有") : pick(locale, "Limited", "较少");
}

function getTags(item: DestinationItem) {
  if (item.tags?.length) {
    const hiddenCoreWords = ["停车", "厕所", "门票", "适合", "年龄", "免费"];
    return item.tags.filter((tag) => !hiddenCoreWords.some((word) => tag.includes(word))).slice(0, 3);
  }
  return (scenarioTags[item.scenario] ?? []).slice(0, 3);
}

function getBadge(item: DestinationItem, rank: number, locale: Locale) {
  if (item.badgeText) return item.badgeText;
  if (rank === 1) return pick(locale, "Hot pick", "热门推荐");
  return pick(locale, scenarioBadge[item.scenario], scenarioBadge[item.scenario]);
}

function getCoverBadges(item: DestinationItem, rank: number, locale: Locale) {
  const badges = [getBadge(item, rank, locale), ...getTags(item)];
  return Array.from(new Set(badges)).slice(0, 3);
}

function reviewText(item: DestinationItem, locale: Locale) {
  if (typeof item.reviewCount === "number" && item.reviewCount > 0) {
    return pick(locale, `${item.reviewCount} reviews`, `${item.reviewCount}条评价`);
  }
  return pick(locale, "No reviews yet", "暂无评价");
}

function MiniInfo({
  icon: Icon,
  label,
  value
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-white/60 px-2 py-2">
      <p className="flex items-center gap-1 text-[11px] leading-4 text-slate-500">
        <Icon className="h-3.5 w-3.5 shrink-0 text-slate-500" />
        <span>{label}</span>
      </p>
      <p className="mt-1 whitespace-normal break-words text-xs font-semibold leading-4 text-slate-700">{value}</p>
    </div>
  );
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
  const tags = getTags(item);

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={() => router.push(detailHref)}
      onKeyDown={(event) => {
        if (event.key === "Enter") router.push(detailHref);
      }}
      className="interactive-card flex h-full shrink-0 snap-start basis-[78vw] cursor-pointer flex-col overflow-hidden rounded-[18px] border border-slate-100 bg-white shadow-[0_10px_26px_rgba(15,23,42,0.06)] sm:basis-[300px] lg:basis-[calc(25%_-_12px)]"
    >
      <Link href={detailHref} onClick={(event) => event.stopPropagation()} className="relative block aspect-[4/3] w-full overflow-hidden rounded-t-[18px] bg-slate-100">
        <img
          src={image.src}
          alt={name}
          loading={rank <= 4 ? "eager" : "lazy"}
          fetchPriority={rank <= 4 ? "high" : "auto"}
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
        <div className="absolute left-3 right-3 top-3 flex flex-wrap gap-2">
          {getCoverBadges(item, rank, locale).map((badge, index) => (
            <span key={`${item.id}-cover-badge-${badge}`} className={`rounded-full px-2.5 py-1 text-xs font-bold text-white shadow-sm ${index === 0 ? "bg-emerald-500" : "bg-sky-500"}`}>
              {badge}
            </span>
          ))}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="space-y-2">
          <Link href={detailHref} onClick={(event) => event.stopPropagation()} className="interactive-text-link line-clamp-1 text-lg font-black text-slate-950">
            {name}
          </Link>
          <p className="flex items-center gap-1.5 text-sm text-slate-500">
            <MapPin className="h-4 w-4 shrink-0 text-emerald-700" />
            <span className="line-clamp-1">
              {destinationRegion(item, locale)} · {formatDistance(item.distanceKm, homeCity, locale)}
            </span>
          </p>
          <p className="line-clamp-2 min-h-11 text-sm leading-5 text-slate-700">{destinationDescription(item, locale)}</p>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl bg-slate-50/80 px-3 py-2.5">
          <MiniInfo icon={Users} label={pick(locale, "Age", "适合")} value={item.suitableAge || destinationAgeRange(item, locale)} />
          <MiniInfo icon={Ticket} label={pick(locale, "Ticket", "门票")} value={ticketText(item, locale)} />
          <MiniInfo icon={Car} label={pick(locale, "Parking", "停车")} value={parkingText(item, locale)} />
          <MiniInfo icon={Bath} label={pick(locale, "Toilet", "厕所")} value={toiletText(item, locale)} />
        </div>

        <div className="mt-3 flex min-h-8 flex-wrap content-start gap-1.5">
          {tags.map((tag, index) => (
            <span key={`${item.id}-${tag}-${index}`} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${index % 2 === 0 ? "bg-emerald-50 text-emerald-700" : "bg-sky-50 text-sky-700"}`}>
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-auto border-t border-slate-100 pt-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <Link
              href={`${detailHref}#reviews`}
              onClick={(event) => event.stopPropagation()}
              className="interactive-text-link inline-flex min-w-0 items-center gap-1 text-sm font-semibold text-slate-700"
              aria-label={pick(locale, "View reviews", "查看评价")}
            >
              <Star className="h-4 w-4 shrink-0 fill-current text-amber-500" />
              <span>{item.rating.toFixed(1)}</span>
              <span className="truncate font-normal text-slate-500">({reviewText(item, locale)})</span>
            </Link>
            <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{destinationScenario(item, locale)}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link href={detailHref} onClick={(event) => event.stopPropagation()} className="interactive-button inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
              {pick(locale, "Details", "查看详情")}
            </Link>
            <div onClick={(event) => event.stopPropagation()}>
              <AmapNavigationButton
                destination={item}
                label={navigationLabel}
                className="h-10 w-full rounded-xl px-3 text-sm font-bold"
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
    viewportRef.current?.scrollBy({ left: direction === "next" ? 320 : -320, behavior: "smooth" });
  }

  return (
    <section id="top10" className="mx-auto mt-5 max-w-6xl scroll-mt-20 px-4">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-950">{pick(locale, `Top family places near ${homeCity}`, `本周${homeCity}TOP10推荐地点`)}</h2>
          <p className="mt-1 text-sm text-slate-500">{pick(locale, "Swipe or drag to explore. Details stay on each place page.", "左右滑动查看更多，完整信息放在详情页。")}</p>
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

      <p className="mt-1 text-center text-xs text-slate-500">{pick(locale, "Distance is an estimate. Please use actual navigation before departure.", "距离仅供参考，出发前请以实际导航为准。")}</p>
    </section>
  );
}
