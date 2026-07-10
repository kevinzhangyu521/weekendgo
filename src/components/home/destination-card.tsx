import Link from "next/link";
import { getDestinationImage } from "@/features/destinations/images";
import { destinationDescription, destinationName, destinationRegion } from "@/features/destinations/presenter";
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

function pick(locale: Locale, en: string, zh: string) {
  return locale === "zh" ? zh : en;
}

function shortReason(item: DestinationItem, locale: Locale) {
  const text = destinationDescription(item, locale).replace(/\s+/g, " ").trim();
  const chars = Array.from(text);
  return chars.length > 48 ? `${chars.slice(0, 48).join("")}...` : text;
}

function cardTags(item: DestinationItem, locale: Locale) {
  void locale;
  return (item.tags ?? []).map((tag) => tag.trim()).filter(Boolean).slice(0, 2);
}

function featuredRecommendation(item: DestinationItem) {
  const recommendation = item.editorRecommendation ?? "";

  return recommendation.trim() || "管理员暂未填写推荐理由。";
}

function featuredAge(item: DestinationItem) {
  if (typeof item.suitableAgeMin === "number" && typeof item.suitableAgeMax === "number" && item.suitableAgeMax > item.suitableAgeMin) {
    return `${item.suitableAgeMin}-${item.suitableAgeMax}岁`;
  }
  if (typeof item.suitableAgeMin === "number" && item.suitableAgeMin >= 0) return `${item.suitableAgeMin}岁+`;
  if (item.suitableAge?.trim()) return item.suitableAge.trim();
  return item.minKidAge > 0 ? `${item.minKidAge}岁+` : "--";
}

function featuredPlayTime(item: DestinationItem) {
  const playTime = item.suggestedDuration ?? "";
  return playTime.trim() || "--";
}

function featuredCost(item: DestinationItem) {
  return item.familyBudget?.trim() || item.ticketPrice?.trim() || "--";
}

function featuredDistance(item: DestinationItem) {
  if (!item.distanceKm || item.distanceKm <= 0) return "--";
  return `${item.distanceKm % 1 === 0 ? item.distanceKm : item.distanceKm.toFixed(1)}km`;
}

export function DestinationCard({ item, locale, homeCity, metaLine, imagePriority = false, featured = false }: Props) {
  const image = getDestinationImage(item);
  const name = destinationName(item, locale);
  const region = metaLine || destinationRegion(item, locale) || homeCity;
  const detailHref = `/destinations/${item.id}`;
  const reason = shortReason(item, locale);
  const tags = cardTags(item, locale);
  const badgeText = item.badgeText?.trim();

  if (featured) {
    const recommendation = featuredRecommendation(item);
    const infoItems = [
      { label: "地点", value: region, icon: "📍" },
      { label: "适合年龄", value: featuredAge(item), icon: "👶" },
      { label: "建议游玩", value: featuredPlayTime(item), icon: "⏰" },
      { label: "人均费用", value: featuredCost(item), icon: "💰" },
      { label: "距离", value: featuredDistance(item), icon: "🚗" }
    ];

    return (
      <Link href={detailHref} className="group mx-auto block w-full max-w-[840px] md:w-[90%] lg:w-[820px]" aria-label={`${name} 查看详情`}>
        <article className="qmd-place-card overflow-hidden">
          <div className="relative h-[320px] overflow-hidden bg-slate-100 md:h-[340px] lg:h-[360px]">
            <HomeDestinationImage
              src={image.src}
              alt={name}
              priority={imagePriority}
              sizes="(max-width: 767px) 100vw, (max-width: 1023px) 90vw, 820px"
              className="h-full w-full object-cover brightness-[1.03] saturate-[1.04] transition duration-300 group-hover:scale-[1.03]"
            />
            {badgeText ? (
              <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-emerald-700 shadow-sm">
                {badgeText}
              </span>
            ) : null}
          </div>
          <div className="p-6 md:p-7">
            <p className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">⭐ 今天最值得去</p>
            <h3 className="mt-4 line-clamp-2 text-2xl font-black leading-tight text-slate-950 md:text-3xl">{name}</h3>
            <p className="mt-3 line-clamp-2 text-base font-semibold leading-7 text-slate-700">{recommendation}</p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {infoItems.map((info) => (
                <div key={info.label} className="rounded-2xl bg-slate-50 px-3 py-3">
                  <p className="text-xs font-semibold text-slate-500">
                    <span aria-hidden="true">{info.icon}</span> {info.label}
                  </p>
                  <p className="mt-1 line-clamp-1 text-sm font-black text-slate-950">{info.value}</p>
                </div>
              ))}
            </div>
          {tags.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
            <span className="mt-5 inline-flex text-sm font-bold text-emerald-700 group-hover:text-emerald-800">
              {pick(locale, "See if it is worth going →", "\u770b\u770b\u503c\u4e0d\u503c\u5f97\u53bb \u2192")}
            </span>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <article className="qmd-place-card flex h-full min-h-[430px] flex-col">
      <Link href={detailHref} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          <HomeDestinationImage
            src={image.src}
            alt={name}
            priority={imagePriority}
            sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 420px"
            className="h-full w-full object-cover brightness-[1.03] saturate-[1.04]"
          />
          {badgeText ? (
            <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-emerald-700 shadow-sm">
              {badgeText}
            </span>
          ) : null}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <Link href={detailHref} className="block">
          <h3 className="line-clamp-1 min-h-7 text-xl font-bold text-slate-950">{name}</h3>
        </Link>
        <p className="mt-2 line-clamp-2 min-h-12 text-sm leading-6 text-slate-600">{reason}</p>
        <p className="mt-3 line-clamp-1 min-h-5 text-sm font-medium text-slate-500">{region}</p>
        {tags.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
        <div className="mt-auto grid grid-cols-2 gap-3 pt-5">
          <Link href={detailHref} className="col-span-2 inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600">
            {pick(locale, "Details", "\u67e5\u770b\u8be6\u60c5")}
          </Link>
        </div>
      </div>
    </article>
  );
}
