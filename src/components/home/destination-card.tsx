import Link from "next/link";
import { Baby, CalendarCheck, Clock3, MapPin, Route, WalletCards, type LucideIcon } from "lucide-react";
import { getDestinationImage } from "@/features/destinations/images";
import { destinationDescription, destinationName, destinationRegion, destinationScenario } from "@/features/destinations/presenter";
import type { DestinationItem } from "@/features/destinations/types";
import type { Locale } from "@/lib/i18n/config";
import { HomeDestinationImage } from "./home-destination-image";

type Props = {
  item: DestinationItem;
  locale: Locale;
  homeCity: string;
  metaLine?: string;
  imagePriority?: boolean;
  featured?: boolean;
};

type InfoItem = {
  key: string;
  label: string;
  value: string;
  icon: LucideIcon;
};

function pick(locale: Locale, en: string, zh: string) {
  return locale === "zh" ? zh : en;
}

function cleanText(value?: string | null) {
  return value?.replace(/\s+/g, " ").trim() || "";
}

function shortText(value: string, maxLength: number) {
  const chars = Array.from(value);
  return chars.length > maxLength ? `${chars.slice(0, maxLength).join("")}...` : value;
}

function shortReason(item: DestinationItem, locale: Locale) {
  const recommendation = cleanText(item.editorRecommendation);
  if (recommendation) return shortText(recommendation, 54);

  const description = cleanText(destinationDescription(item, locale));
  return description ? shortText(description, 54) : pick(locale, "Recommendation is being updated.", "推荐理由正在补充中");
}

function ageValue(item: DestinationItem, locale: Locale) {
  const min = item.suitableAgeMin;
  const max = item.suitableAgeMax;

  if (typeof min === "number" && typeof max === "number" && max > min) {
    return locale === "zh" ? `${min}-${max}岁` : `${min}-${max} years`;
  }

  if (typeof min === "number" && min >= 0 && typeof max !== "number") {
    return locale === "zh" ? `${min}岁+` : `${min}+ years`;
  }

  if (cleanText(item.suitableAge)) return cleanText(item.suitableAge);
  if (item.minKidAge > 0) return locale === "zh" ? `${item.minKidAge}岁+` : `${item.minKidAge}+ years`;

  return null;
}

function durationValue(item: DestinationItem) {
  return cleanText(item.suggestedDuration) || null;
}

function budgetValue(item: DestinationItem) {
  return cleanText(item.familyBudget) || cleanText(item.ticketPrice) || null;
}

function distanceValue(item: DestinationItem, homeCity: string, locale: Locale) {
  if (!item.distanceKm || item.distanceKm <= 0) return null;

  const value = Number.isInteger(item.distanceKm) ? `${item.distanceKm}` : item.distanceKm.toFixed(1);
  return pick(locale, `About ${value} km from ${homeCity}`, `距${homeCity}约${value}公里`);
}

function reservationValue(item: DestinationItem, locale: Locale) {
  if (item.reservationRequired === true) return pick(locale, "Reservation needed", "需要预约");
  return null;
}

function cardTags(item: DestinationItem, locale: Locale) {
  const values = [destinationScenario(item, locale), ...(item.tags ?? [])]
    .map((tag) => tag.trim())
    .filter(Boolean)
    .filter((tag) => !/(停车|厕所|门票|免费|现场|0-3|3-6|6-12|12岁|适合年龄)/.test(tag));

  return Array.from(new Set(values)).slice(0, 2);
}

function featuredInfoItems(item: DestinationItem, locale: Locale, homeCity: string, region: string): InfoItem[] {
  const age = ageValue(item, locale);
  const duration = durationValue(item);
  const budget = budgetValue(item);
  const distance = distanceValue(item, homeCity, locale);
  const reservation = reservationValue(item, locale);
  const candidates: Array<InfoItem | null> = [
    { key: "region", label: pick(locale, "Area", "地点"), value: region, icon: MapPin },
    age ? { key: "age", label: pick(locale, "Age", "适合年龄"), value: age, icon: Baby } : null,
    duration ? { key: "duration", label: pick(locale, "Duration", "游玩时长"), value: duration, icon: Clock3 } : null,
    budget ? { key: "budget", label: pick(locale, "Budget", "家庭预算"), value: budget, icon: WalletCards } : null,
    distance ? { key: "distance", label: pick(locale, "Distance", "距离"), value: distance, icon: Route } : null,
    reservation ? { key: "reservation", label: pick(locale, "Reservation", "预约"), value: reservation, icon: CalendarCheck } : null
  ];

  return candidates.filter((info): info is InfoItem => info !== null).slice(0, 6);
}

function compactInfoItems(item: DestinationItem, locale: Locale, homeCity: string, metaLine?: string): InfoItem[] {
  const distance = metaLine || distanceValue(item, homeCity, locale);
  const duration = durationValue(item);
  const budget = budgetValue(item);
  const age = ageValue(item, locale);
  const candidates: Array<InfoItem | null> = [
    distance ? { key: "distance", label: pick(locale, "Distance", "距离"), value: distance.replace(/^📍\s*/, ""), icon: Route } : null,
    age ? { key: "age", label: pick(locale, "Age", "年龄"), value: age, icon: Baby } : null,
    duration ? { key: "duration", label: pick(locale, "Duration", "时长"), value: duration, icon: Clock3 } : null,
    !duration && budget ? { key: "budget", label: pick(locale, "Budget", "预算"), value: budget, icon: WalletCards } : null
  ];

  return candidates.filter((info): info is InfoItem => info !== null).slice(0, 3);
}

function ImageBadge({ children }: { children: string }) {
  return (
    <span className="inline-flex rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-800 shadow-sm backdrop-blur">
      {children}
    </span>
  );
}

function InfoTile({ item, compact = false }: { item: InfoItem; compact?: boolean }) {
  const Icon = item.icon;
  return (
    <div className={compact ? "rounded-2xl bg-slate-50 px-3 py-2" : "rounded-2xl bg-slate-50 px-3.5 py-3"}>
      <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
        <Icon className="h-3.5 w-3.5" />
        {item.label}
      </p>
      <p className="mt-1 line-clamp-1 text-sm font-black text-slate-950">{item.value}</p>
    </div>
  );
}

export function DestinationCard({ item, locale, homeCity, metaLine, imagePriority = false, featured = false }: Props) {
  const image = getDestinationImage(item);
  const name = destinationName(item, locale);
  const region = metaLine || destinationRegion(item, locale) || homeCity;
  const detailHref = `/destinations/${item.id}`;
  const reason = shortReason(item, locale);
  const tags = cardTags(item, locale);
  const sceneLabel = destinationScenario(item, locale);

  if (featured) {
    const infoItems = featuredInfoItems(item, locale, homeCity, region);

    return (
      <Link href={detailHref} className="group block" aria-label={`${name} ${pick(locale, "details", "查看详情")}`}>
        <article className="qmd-place-card grid overflow-hidden md:grid-cols-[52fr_48fr]">
          <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 md:h-full md:min-h-[360px]">
            <HomeDestinationImage
              src={image.src}
              alt={name}
              priority={imagePriority}
              sizes="(max-width: 767px) 100vw, (max-width: 1279px) 52vw, 630px"
              className="h-full w-full object-cover brightness-[1.03] saturate-[1.04] transition duration-200 group-hover:scale-[1.03]"
            />
            <div className="absolute left-4 top-4 flex max-w-[calc(100%-2rem)] flex-wrap gap-2">
              <ImageBadge>{pick(locale, "Today", "今日推荐")}</ImageBadge>
              <ImageBadge>{sceneLabel}</ImageBadge>
            </div>
          </div>
          <div className="flex flex-col p-5 md:p-7">
            <p className="text-sm font-black text-emerald-700">{pick(locale, "Today's Recommendation", "今日推荐")}</p>
            <h3 className="mt-3 line-clamp-2 text-3xl font-black leading-tight text-slate-950 md:text-4xl">{name}</h3>
            <p className="mt-3 line-clamp-2 text-base font-semibold leading-7 text-slate-700">{reason}</p>
            {infoItems.length > 0 ? (
              <div className="mt-5 grid grid-cols-2 gap-2 lg:grid-cols-3">
                {infoItems.map((info) => (
                  <InfoTile key={info.key} item={info} />
                ))}
              </div>
            ) : (
              <p className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
                {pick(locale, "Decision details are being confirmed.", "决策信息正在确认中")}
              </p>
            )}
            {tags.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span key={tag} className="qmd-tag qmd-tag--play">
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
            <span className="mt-5 inline-flex text-sm font-bold text-emerald-700 group-hover:text-emerald-800 md:mt-auto md:pt-5">
              {pick(locale, "View details", "查看详情")}
            </span>
          </div>
        </article>
      </Link>
    );
  }

  const infoItems = compactInfoItems(item, locale, homeCity, metaLine);

  return (
    <article className="qmd-place-card group flex h-full min-h-[390px] flex-col">
      <Link href={detailHref} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          <HomeDestinationImage
            src={image.src}
            alt={name}
            priority={imagePriority}
            sizes="(max-width: 639px) 50vw, (max-width: 1023px) 50vw, (max-width: 1279px) 33vw, 300px"
            className="h-full w-full object-cover brightness-[1.03] saturate-[1.04] transition duration-200 group-hover:scale-[1.03]"
          />
          <div className="absolute left-3 top-3 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-2">
            <ImageBadge>{sceneLabel}</ImageBadge>
          </div>
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <Link href={detailHref} className="block">
          <h3 className="line-clamp-2 text-lg font-black leading-tight text-slate-950 sm:text-xl">{name}</h3>
        </Link>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{reason}</p>
        <p className="mt-3 line-clamp-1 text-sm font-semibold text-slate-500">{destinationRegion(item, locale) || homeCity}</p>
        {infoItems.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {infoItems.map((info) => (
              <InfoTile key={info.key} item={info} compact />
            ))}
          </div>
        ) : null}
        {tags.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="qmd-tag qmd-tag--play">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
        <div className="mt-auto pt-4">
          <Link href={detailHref} className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700">
            {pick(locale, "Details", "查看详情")}
          </Link>
        </div>
      </div>
    </article>
  );
}
