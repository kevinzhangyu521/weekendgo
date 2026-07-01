import Link from "next/link";
import { getDestinationImage } from "@/features/destinations/images";
import { destinationName, destinationRegion } from "@/features/destinations/presenter";
import type { DestinationItem, Scenario } from "@/features/destinations/types";
import type { Locale } from "@/lib/i18n/config";

type Props = {
  item: DestinationItem;
  locale: Locale;
  homeCity: string;
  badgeLabel?: string;
  imagePriority?: boolean;
  featured?: boolean;
};

const scenarioTags: Record<Scenario, { en: string[]; zh: string[] }> = {
  camping: { en: ["Camping", "Family"], zh: ["露营", "亲子"] },
  creek: { en: ["Water", "Family"], zh: ["玩水", "亲子"] },
  hiking: { en: ["Walk", "Family"], zh: ["公园", "亲子"] },
  picnic: { en: ["Picnic", "Family"], zh: ["公园", "亲子"] }
};

function pick(locale: Locale, en: string, zh: string) {
  return locale === "zh" ? zh : en;
}

function shortReason(item: DestinationItem, locale: Locale) {
  const name = destinationName(item, "zh");
  const knownReasons: Array<[string, string]> = [
    ["东湖绿道", "市区内轻松遛娃，骑行和野餐都方便。"],
    ["木兰草原", "适合第一次带孩子体验草地露营。"],
    ["后官湖", "适合安静散步、骑行和放松。"],
    ["木兰天池", "山水路线轻松，适合亲子玩水。"]
  ];

  if (locale === "zh") {
    const matched = knownReasons.find(([keyword]) => name.includes(keyword));
    if (matched) return matched[1];
  }

  const defaults: Record<Scenario, { en: string; zh: string }> = {
    camping: { en: "An easy outdoor pick for a family weekend.", zh: "适合周末带孩子轻松出发。" },
    creek: { en: "A refreshing water-play place for families.", zh: "适合亲子玩水和短途放松。" },
    hiking: { en: "A simple walk for family time outdoors.", zh: "适合散步、遛娃和亲近自然。" },
    picnic: { en: "A relaxed place for picnic and family time.", zh: "适合野餐、散步和亲子放松。" }
  };

  return pick(locale, defaults[item.scenario].en, defaults[item.scenario].zh);
}

function cardTags(item: DestinationItem, locale: Locale) {
  return (locale === "zh" ? scenarioTags[item.scenario].zh : scenarioTags[item.scenario].en).slice(0, 2);
}

export function DestinationCard({ item, locale, homeCity, badgeLabel, imagePriority = false, featured = false }: Props) {
  void featured;

  const image = getDestinationImage(item);
  const name = destinationName(item, locale);
  const region = destinationRegion(item, locale) || homeCity;
  const detailHref = `/destinations/${item.id}`;

  return (
    <article className="qmd-place-card flex h-full min-h-[430px] flex-col">
      <Link href={detailHref} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          <img
            src={image.src}
            alt={name}
            loading={imagePriority ? "eager" : "lazy"}
            fetchPriority={imagePriority ? "high" : "auto"}
            decoding="async"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover brightness-[1.03] saturate-[1.04]"
          />
          {badgeLabel ? (
            <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-emerald-700 shadow-sm">
              {badgeLabel}
            </span>
          ) : null}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <Link href={detailHref} className="block">
          <h3 className="line-clamp-1 min-h-7 text-xl font-bold text-slate-950">{name}</h3>
        </Link>
        <p className="mt-2 line-clamp-2 min-h-12 text-sm leading-6 text-slate-600">{shortReason(item, locale)}</p>
        <p className="mt-3 line-clamp-1 min-h-5 text-sm font-medium text-slate-500">{region}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {cardTags(item, locale).map((tag) => (
            <span key={tag} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-auto grid grid-cols-2 gap-3 pt-5">
          <Link href={detailHref} className="col-span-2 inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600">
            {pick(locale, "Details", "查看详情")}
          </Link>
        </div>
      </div>
    </article>
  );
}
