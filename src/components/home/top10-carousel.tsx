"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { MapPin, Star } from "lucide-react";
import { AmapNavigationButton } from "@/components/plans/amap-navigation-button";
import { DEFAULT_DESTINATION_IMAGE, getDestinationImage } from "@/features/destinations/images";
import { destinationName, destinationRegion } from "@/features/destinations/presenter";
import type { DestinationItem, Scenario } from "@/features/destinations/types";
import type { Locale } from "@/lib/i18n/config";

type RankingKey = "overall" | "creek" | "camping" | "youngKids";

type Props = {
  locale: Locale;
  homeCity: string;
  rankings: Record<RankingKey, DestinationItem[]>;
  isSignedIn?: boolean;
};

type CardProps = {
  item: DestinationItem;
  locale: Locale;
  homeCity: string;
  isSignedIn: boolean;
  badgeLabel?: string;
  inspiration?: boolean;
  showRating?: boolean;
  imagePriority?: boolean;
};

const homeContainerClass = "qmd-container";
const homeGridClass = "qmd-grid-3";

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

function inspirationDistanceLine(item: DestinationItem, homeCity: string, locale: Locale) {
  const region = destinationRegion(item, locale);
  if (!item.distanceKm || item.distanceKm <= 0) {
    return pick(locale, `${region || homeCity} · Check navigation`, `${region || homeCity}周边 · 车程以导航为准`);
  }

  const driveTime = item.driveTime || estimateDriveTime(item.distanceKm, locale);
  return pick(
    locale,
    `${region || homeCity} · about ${formatKm(item.distanceKm)} km · ${driveTime}`,
    `${region || homeCity} · 距${homeCity}约${formatKm(item.distanceKm)}公里 · ${driveTime}`
  );
}

function recommendationBadge(item: DestinationItem, locale: Locale, badgeLabel?: string) {
  if (badgeLabel) return badgeLabel;
  const customBadge = item.badgeText?.trim();
  if (customBadge && !/^top\s*\d+$/i.test(customBadge)) return customBadge;
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

  const defaultReasons: Record<Scenario, { en: string; zh: string }> = {
    camping: { en: "An easier first camping trip for families.", zh: "第一次带孩子来武汉，我最推荐这里。" },
    creek: { en: "A refreshing water-play pick for warm days.", zh: "夏季玩水体验很好。" },
    hiking: { en: "A light outdoor walk for family weekends.", zh: "适合周末轻松徒步和放风。" },
    picnic: { en: "An easy city escape for picnic and cycling.", zh: "市区内最轻松的骑行路线。" }
  };

  return trimText(pick(locale, defaultReasons[item.scenario].en, defaultReasons[item.scenario].zh), locale === "zh" ? 36 : 88);
}

function ratingText(item: DestinationItem, locale: Locale) {
  if (typeof item.reviewCount === "number" && item.reviewCount > 0 && typeof item.rating === "number" && item.rating > 0) {
    return pick(locale, `${item.rating.toFixed(1)} (${item.reviewCount} reviews)`, `${item.rating.toFixed(1)}（${item.reviewCount}条评价）`);
  }
  return pick(locale, "No reviews yet", "暂无评价");
}

function tagClassName(tag: string) {
  if (["玩水", "溯溪", "露营", "野餐", "骑行", "徒步"].includes(tag)) {
    return "qmd-tag--play";
  }
  if (["遛娃", "亲子"].includes(tag)) {
    return "qmd-tag--season";
  }
  return "qmd-tag--people";
}

export function HomeSectionHeader({
  title,
  subtitle,
  href,
  action,
  locale
}: {
  title: string;
  subtitle?: string;
  href?: string;
  action?: ReactNode;
  locale: Locale;
}) {
  return (
    <div className="qmd-section-header">
      <div>
        <h2 className="qmd-section-title">{title}</h2>
        {subtitle ? <p className="qmd-section-subtitle">{subtitle}</p> : null}
      </div>
      {action ??
        (href ? (
          <Link href={href} className="inline-flex shrink-0 items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-emerald-700 transition hover:border-emerald-200 hover:bg-emerald-50">
            {pick(locale, "More", "更多")}
          </Link>
        ) : null)}
    </div>
  );
}

export function HomeDestinationCard({ item, locale, homeCity, isSignedIn, badgeLabel, inspiration = false, showRating = true, imagePriority = false }: CardProps) {
  const router = useRouter();
  const image = getDestinationImage(item);
  const name = destinationName(item, locale);
  const detailHref = `/destinations/${item.id}`;
  const navigationLabel = pick(locale, "Navigate", "立即导航");
  const tags = playTags(item, locale);
  const cardDistanceLine = inspiration ? inspirationDistanceLine(item, homeCity, locale) : distanceLine(item, homeCity, locale);

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={() => router.push(detailHref)}
      onKeyDown={(event) => {
        if (event.key === "Enter") router.push(detailHref);
      }}
      className="qmd-place-card group flex h-full cursor-pointer flex-col"
    >
      <Link href={detailHref} onClick={(event) => event.stopPropagation()} className="relative block aspect-[4/3] w-full overflow-hidden bg-slate-100">
        <img
          src={image.src}
          alt={name}
          loading={imagePriority ? "eager" : "lazy"}
          fetchPriority={imagePriority ? "high" : "auto"}
          decoding="async"
          referrerPolicy="no-referrer"
          onError={(event) => {
            const img = event.currentTarget;
            if (img.dataset.fallbackApplied === "true") return;
            img.dataset.fallbackApplied = "true";
            img.src = DEFAULT_DESTINATION_IMAGE;
          }}
          className="qmd-place-card__image block h-full transition-transform duration-300 ease-out group-hover:scale-[1.03]"
        />
        <div className="absolute left-4 top-4">
          <span className={inspiration ? "rounded-full bg-white/90 px-3 py-1.5 text-xs font-black text-emerald-700 shadow-sm backdrop-blur" : "rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm"}>
            {recommendationBadge(item, locale, badgeLabel)}
          </span>
        </div>
      </Link>

      <div className="qmd-place-card__body flex flex-1 flex-col">
        <div className={inspiration ? "space-y-3.5" : "space-y-3"}>
          <Link href={detailHref} onClick={(event) => event.stopPropagation()} className={inspiration ? "line-clamp-2 text-[22px] font-black leading-tight tracking-[-0.02em] text-slate-950 md:text-2xl" : "line-clamp-2 text-[22px] font-bold leading-tight text-slate-950 md:text-[30px]"}>
            {name}
          </Link>

          <p className={inspiration ? "flex items-center gap-1.5 text-[14px] font-semibold text-[#64748B]" : "flex items-center gap-1.5 text-[15px] font-medium text-[#64748B]"}>
            <MapPin className={`h-4 w-4 shrink-0 ${inspiration ? "text-emerald-600" : "text-emerald-700"}`} />
            <span className="line-clamp-1">{cardDistanceLine}</span>
          </p>

          <p className={inspiration ? "line-clamp-2 min-h-[50px] text-[15px] leading-[1.65] text-[#4B5563]" : "line-clamp-2 min-h-[52px] text-base leading-[1.6] text-[#4B5563]"}>{shortReason(item, locale)}</p>
        </div>

        <div className="mt-4 flex min-h-8 flex-wrap gap-2">
          {tags.map((tag, index) => (
            <span key={`${item.id}-${tag}-${index}`} className={`qmd-tag ${tagClassName(tag)}`}>
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-auto border-t border-slate-100 pt-4">
          {showRating ? (
            <Link href={`${detailHref}#reviews`} onClick={(event) => event.stopPropagation()} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-emerald-700">
              <Star className="h-4 w-4 fill-current text-amber-500" />
              <span>{ratingText(item, locale)}</span>
            </Link>
          ) : null}

          <div className="qmd-card-actions">
            <Link
              href={detailHref}
              onClick={(event) => event.stopPropagation()}
              className="qmd-btn-secondary px-3 text-sm shadow-sm transition-all duration-300 ease-out hover:border-emerald-200 hover:bg-gradient-to-r hover:from-white hover:to-emerald-50 hover:text-emerald-700 hover:shadow-md active:scale-[0.98]"
            >
              {pick(locale, "Details", "查看详情")}
            </Link>
            <div onClick={(event) => event.stopPropagation()}>
              <AmapNavigationButton
                destination={item}
                label={navigationLabel}
                className="qmd-btn-primary w-full px-3 text-sm shadow-sm transition-all duration-300 ease-out hover:bg-emerald-700 hover:shadow-md active:scale-[0.98]"
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
  const items = (rankings.overall ?? []).slice(0, 6);

  return (
    <section id="top10" className={`${homeContainerClass} qmd-section scroll-mt-20`}>
      <HomeSectionHeader
        title={pick(locale, "Where to go this weekend?", "这个周末去哪？")}
        subtitle={pick(locale, "Family-friendly camping and water-play picks for this week.", "精选适合本周出发的亲子、露营、玩水目的地。")}
        locale={locale}
      />

      <div className={homeGridClass}>
        {items.map((item, index) => (
          <HomeDestinationCard
            key={item.id}
            item={item}
            locale={locale}
            homeCity={homeCity}
            isSignedIn={isSignedIn}
            badgeLabel={index === 0 ? pick(locale, "Hot this week", "本周热门") : undefined}
            inspiration
            showRating={false}
            imagePriority={index < 3}
          />
        ))}
      </div>
    </section>
  );
}

export const homeLayoutClasses = {
  container: homeContainerClass,
  grid: homeGridClass
};
