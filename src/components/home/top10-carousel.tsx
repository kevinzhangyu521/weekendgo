"use client";

import Link from "next/link";
import { Bath, Car, Clock, MapPin, Star, Ticket, Users } from "lucide-react";
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

const rankingTabs: Array<{ key: RankingKey; labelZh: string; labelEn: string }> = [
  { key: "overall", labelZh: "综合榜", labelEn: "Overall" },
  { key: "creek", labelZh: "溯溪榜", labelEn: "Creek" },
  { key: "camping", labelZh: "露营榜", labelEn: "Camping" },
  { key: "youngKids", labelZh: "低龄儿童榜", labelEn: "Young kids" }
];

const scenarioBadge: Record<Scenario, string> = {
  camping: "露营圣地",
  creek: "玩水好去处",
  hiking: "亲子徒步",
  picnic: "热门推荐"
};

const scenarioTags: Record<Scenario, string[]> = {
  camping: ["露营", "遛娃", "可停车"],
  creek: ["溯溪", "玩水", "避暑"],
  hiking: ["徒步", "亲子游", "观景"],
  picnic: ["野餐", "遛娃", "拍照"]
};

function pick(locale: Locale, en: string, zh: string) {
  return locale === "zh" ? zh : en;
}

function formatDistance(distanceKm: number, homeCity: string, locale: Locale) {
  if (!distanceKm || distanceKm <= 0) return pick(locale, "Distance pending", "距离待计算");
  return pick(locale, `About ${distanceKm}km from ${homeCity}`, `距${homeCity}约${distanceKm}公里`);
}

function estimateDriveTime(distanceKm: number, locale: Locale) {
  if (!distanceKm || distanceKm <= 0) return pick(locale, "Time pending", "车程待确认");
  const minutes = Math.max(25, Math.round((distanceKm / 48) * 60));
  if (minutes < 60) return pick(locale, `About ${minutes} min`, `车程约${minutes}分钟`);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return pick(locale, `About ${hours}.${Math.round((rest / 60) * 10)}h`, `车程约${rest ? `${hours}小时${rest}分钟` : `${hours}小时`}`);
}

function ticketText(item: DestinationItem, locale: Locale) {
  if (item.ticketPrice) return item.ticketPrice;
  if (item.scenario === "picnic") return pick(locale, "Check locally", "以现场为准");
  return pick(locale, "Check official price", "以景区为准");
}

function parkingText(item: DestinationItem, locale: Locale) {
  if (item.parkingInfo) return item.parkingInfo;
  return item.hasParking ? pick(locale, "Available", "可停车") : pick(locale, "Limited", "停车较少");
}

function toiletText(item: DestinationItem, locale: Locale) {
  if (item.toiletInfo) return item.toiletInfo;
  return item.hasToilet ? pick(locale, "Available", "有") : pick(locale, "Limited", "较少");
}

function getTags(item: DestinationItem, locale: Locale) {
  if (item.tags?.length) return item.tags.slice(0, 6);
  const tags = scenarioTags[item.scenario] ?? [];
  const facilityTags = [item.hasParking ? "可停车" : "停车少", item.hasToilet ? "有厕所" : "厕所少"];
  const ageTag = destinationAgeRange(item, locale);
  return [...tags, ageTag, ...facilityTags].slice(0, 6);
}

function getBadge(item: DestinationItem, rank: number, locale: Locale) {
  if (item.badgeText) return item.badgeText;
  if (rank === 1) return pick(locale, "Hot pick", "热门推荐");
  return pick(locale, scenarioBadge[item.scenario], scenarioBadge[item.scenario]);
}

function reviewText(item: DestinationItem, locale: Locale) {
  if (typeof item.reviewCount === "number" && item.reviewCount > 0) {
    return pick(locale, `${item.reviewCount} reviews`, `${item.reviewCount}条评价`);
  }
  return pick(locale, "Reviews pending", "暂无评价");
}

function DecisionDestinationCard({
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
  const image = getDestinationImage(item);
  const name = destinationName(item, locale);
  const detailHref = `/destinations/${item.id}`;
  const tags = getTags(item, locale);

  return (
    <article className="interactive-card flex h-full flex-col overflow-hidden rounded-[18px] border border-slate-100 bg-white shadow-sm">
      <Link href={detailHref} className="group relative block aspect-[4/3] overflow-hidden bg-slate-100">
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
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white shadow-sm">{getBadge(item, rank, locale)}</span>
          {rank <= 3 ? <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-white shadow-sm">TOP {rank}</span> : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="space-y-2">
          <Link href={detailHref} className="interactive-text-link line-clamp-1 text-xl font-black text-slate-950">
            {name}
          </Link>

          <div className="space-y-1.5 text-sm text-slate-600">
            <p className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-emerald-700" />
              <span>{item.region || destinationRegion(item, locale)}</span>
            </p>
            <p className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-slate-500" />
              <span>
                {formatDistance(item.distanceKm, homeCity, locale)} · {item.driveTime || estimateDriveTime(item.distanceKm, locale)}
              </span>
            </p>
          </div>

          <p className="line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-slate-700">{destinationDescription(item, locale)}</p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-slate-700 sm:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 px-3 py-2">
            <Users className="mb-1 h-4 w-4 text-slate-500" />
            <p className="text-xs text-slate-400">{pick(locale, "Age", "适合")}</p>
            <p className="font-semibold">{item.suitableAge || destinationAgeRange(item, locale)}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-3 py-2">
            <Ticket className="mb-1 h-4 w-4 text-slate-500" />
            <p className="text-xs text-slate-400">{pick(locale, "Ticket", "门票")}</p>
            <p className="font-semibold">{ticketText(item, locale)}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-3 py-2">
            <Car className="mb-1 h-4 w-4 text-slate-500" />
            <p className="text-xs text-slate-400">{pick(locale, "Parking", "停车")}</p>
            <p className="font-semibold">{parkingText(item, locale)}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-3 py-2">
            <Bath className="mb-1 h-4 w-4 text-slate-500" />
            <p className="text-xs text-slate-400">{pick(locale, "Toilet", "厕所")}</p>
            <p className="font-semibold">{toiletText(item, locale)}</p>
          </div>
        </div>

        <div className="mt-4 flex min-h-16 flex-wrap content-start gap-2">
          {tags.map((tag, index) => (
            <span key={`${item.id}-${tag}-${index}`} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${index % 2 === 0 ? "bg-emerald-50 text-emerald-700" : "bg-sky-50 text-sky-700"}`}>
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-auto border-t border-slate-100 pt-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700">
              <Star className="h-4 w-4 fill-current text-amber-500" />
              {item.rating.toFixed(1)} <span className="font-normal text-slate-500">({reviewText(item, locale)})</span>
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{destinationScenario(item, locale)}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link href={detailHref} className="interactive-button inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50">
              {pick(locale, "Details", "查看详情")}
            </Link>
            <AmapNavigationButton
              destination={item}
              label={pick(locale, "Navigate", "立即导航")}
              className="h-11 rounded-xl px-4 text-sm font-bold"
              isSignedIn={isSignedIn}
              loginHref={`/login?next=${encodeURIComponent(detailHref)}`}
              signedOutLabel={pick(locale, "Sign in", "登录后导航")}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

export function Top10Carousel({ locale, homeCity, rankings, isSignedIn = false }: Props) {
  const items = rankings.overall ?? [];

  return (
    <section id="top10" className="mx-auto mt-5 max-w-6xl scroll-mt-20 px-4">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-950">{pick(locale, `Top family places near ${homeCity}`, `本周${homeCity}TOP10遛娃地`)}</h2>
          <p className="mt-1 text-sm text-slate-500">{pick(locale, "Compare distance, drive time, facilities and reviews before you go.", "先看距离、车程、设施和评价，再决定去哪。")}</p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
          {rankingTabs.map((tab) => (
            <Link
              key={tab.key}
              href={tab.key === "overall" ? "#top10" : `/destinations?scenario=${tab.key === "youngKids" ? "all" : tab.key}&difficulty=${tab.key === "youngKids" ? "easy" : "all"}&maxDistance=120&needParking=false&needToilet=false`}
              className={`interactive-button shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${
                tab.key === "overall" ? "bg-slate-950 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200"
              }`}
            >
              {pick(locale, tab.labelEn, tab.labelZh)}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item, index) => (
          <DecisionDestinationCard key={item.id} item={item} locale={locale} homeCity={homeCity} rank={index + 1} isSignedIn={isSignedIn} />
        ))}
      </div>

      <p className="mt-4 text-center text-xs text-slate-500">{pick(locale, "Distance and drive time are estimates. Please use actual navigation before departure.", "距离和车程仅供参考，出发前请以实际导航为准。")}</p>
    </section>
  );
}
