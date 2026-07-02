import Link from "next/link";
import { getDestinationImage } from "@/features/destinations/images";
import { destinationDescription, destinationName, destinationRegion } from "@/features/destinations/presenter";
import type { DestinationItem } from "@/features/destinations/types";
import type { Locale } from "@/lib/i18n/config";

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

export function DestinationCard({ item, locale, homeCity, metaLine, imagePriority = false, featured = false }: Props) {
  const image = getDestinationImage(item);
  const name = destinationName(item, locale);
  const region = metaLine || destinationRegion(item, locale) || homeCity;
  const detailHref = `/destinations/${item.id}`;
  const reason = shortReason(item, locale);
  const tags = cardTags(item, locale);
  const badgeText = item.badgeText?.trim();

  if (featured) {
    return (
      <article className="qmd-place-card grid overflow-hidden md:grid-cols-[55fr_45fr]">
        <Link href={detailHref} className="block">
          <div className="relative aspect-[16/10] h-full overflow-hidden bg-slate-100 md:aspect-auto">
            <img
              src={image.src}
              alt={name}
              loading={imagePriority ? "eager" : "lazy"}
              fetchPriority={imagePriority ? "high" : "auto"}
              decoding="async"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover brightness-[1.03] saturate-[1.04]"
            />
            {badgeText ? (
              <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-emerald-700 shadow-sm">
                {badgeText}
              </span>
            ) : null}
          </div>
        </Link>
        <div className="flex min-h-[280px] flex-col p-6 md:p-8">
          <Link href={detailHref} className="block">
            <h3 className="line-clamp-2 text-2xl font-black leading-tight text-slate-950 md:text-3xl">{name}</h3>
          </Link>
          <p className="mt-4 line-clamp-2 text-base leading-7 text-slate-600">{reason}</p>
          <p className="mt-4 line-clamp-1 text-sm font-medium text-slate-500">{region}</p>
          {tags.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
          <div className="mt-auto pt-6">
            <Link href={detailHref} className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700">
              {pick(locale, "Details", "\u67e5\u770b\u8be6\u60c5")}
            </Link>
          </div>
        </div>
      </article>
    );
  }

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
