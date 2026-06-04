import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, Backpack, Bath, Car, ChevronLeft, Clock, MapPinned, ShieldCheck, Star, TentTree, Users } from "lucide-react";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { AddToPlanButton } from "@/components/plans/add-to-plan-button";
import {
  destinationDescription,
  destinationBestFor,
  destinationDecisionTags,
  destinationDifficulty,
  destinationFamilyHighlight,
  destinationName,
  destinationPackingList,
  destinationRegion,
  destinationSafety,
  destinationSafetyTip,
  destinationScenario,
  destinationTripDuration
} from "@/features/destinations/presenter";
import { getDestinationById, getRelatedDestinations } from "@/features/destinations/repository";
import { getMyProfile } from "@/features/profiles/repository";
import { DEFAULT_HOME_CITY, withDistanceFromCity } from "@/lib/geo/distance";
import { getLocale, pick } from "@/lib/i18n/server";

function formatDistance(distanceKm: number, locale: "en" | "zh") {
  if (!distanceKm || distanceKm <= 0) return pick(locale, "Distance pending", "\u8ddd\u79bb\u5f85\u8ba1\u7b97");
  return pick(locale, `About ${distanceKm}km away`, `\u7ea6 ${distanceKm}km`);
}

export default async function DestinationDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const locale = await getLocale();
  const isZh = locale === "zh";
  const { id } = await params;
  const profile = await getMyProfile();
  const homeCity = profile?.homeCity?.trim() || DEFAULT_HOME_CITY;
  const destinationRaw = await getDestinationById(id);

  if (!destinationRaw) notFound();

  const [destination] = withDistanceFromCity([destinationRaw], homeCity);
  const related = withDistanceFromCity(await getRelatedDestinations(destination.id), homeCity);
  const decisionTags = destinationDecisionTags(destination, locale);
  const packingList = destinationPackingList(destination, locale);

  return (
    <main className="min-h-screen bg-slate-50 pb-12">
      <section className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <Link href="/destinations" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
          <ChevronLeft className="h-4 w-4" />
          {pick(locale, "Back to destinations", "\u8fd4\u56de\u76ee\u7684\u5730\u5217\u8868")}
        </Link>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="h-64 bg-cover bg-center md:h-96" style={{ backgroundImage: `url('${destination.image}')` }} />
          <div className="space-y-4 p-5 md:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                {destinationScenario(destination, locale)}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                {destinationDifficulty(destination, locale)}
              </span>
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs text-amber-700">
                {destinationSafety(destination, locale)}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">{destinationName(destination, locale)}</h1>
            <p className="rounded-xl bg-emerald-50 px-4 py-3 text-base font-semibold text-emerald-800">{destinationFamilyHighlight(destination, locale)}</p>
            <div className="flex items-center gap-2">
              <FavoriteButton destinationId={destination.id} />
              <AddToPlanButton destinationId={destination.id} locale={locale} />
              <span className="text-sm text-slate-600">{pick(locale, "Save this destination", "\u6536\u85cf\u6216\u52a0\u5165\u8ba1\u5212")}</span>
            </div>
            <p className="text-slate-600">{destinationDescription(destination, locale)}</p>
            <div className="flex flex-wrap gap-2">
              {decisionTags.map((tag) => (
                <span key={tag} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
                  {tag}
                </span>
              ))}
            </div>

            <div className="grid gap-3 text-sm text-slate-700 md:grid-cols-4">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">{pick(locale, "Region", "\u7701\u5e02")}</p>
                <p className="mt-1 font-medium">{destinationRegion(destination, locale)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">{pick(locale, "Distance", "\u8ddd\u79bb")}</p>
                <p className="mt-1 font-medium">{formatDistance(destination.distanceKm, locale)}</p>
                <p className="mt-1 text-xs text-slate-500">{pick(locale, `From ${homeCity}`, `\u6309\u5e38\u4f4f\u57ce\u5e02\u300c${homeCity}\u300d\u8ba1\u7b97`)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">{pick(locale, "Kids Age", "\u5b69\u5b50\u5e74\u9f84")}</p>
                <p className="mt-1 font-medium">{isZh ? `${destination.minKidAge}\u5c81+` : `${destination.minKidAge}+ years`}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">{pick(locale, "Rating", "\u8bc4\u5206")}</p>
                <p className="mt-1 inline-flex items-center gap-1 font-medium">
                  <Star className="h-4 w-4 fill-current text-amber-500" />
                  {destination.rating.toFixed(1)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <section className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
            <h2 className="mb-2 inline-flex items-center gap-2 text-base font-semibold text-emerald-950">
              <Users className="h-4 w-4" />
              {pick(locale, "Best for", "\u9002\u5408\u8c01\u53bb")}
            </h2>
            <p className="text-sm leading-6 text-emerald-900">{destinationBestFor(destination, locale)}</p>
          </div>

          <div className="rounded-xl border border-sky-100 bg-sky-50 p-4">
            <h2 className="mb-2 inline-flex items-center gap-2 text-base font-semibold text-sky-950">
              <Clock className="h-4 w-4" />
              {pick(locale, "Suggested time", "\u5efa\u8bae\u6e38\u73a9\u65f6\u957f")}
            </h2>
            <p className="text-sm leading-6 text-sky-900">{destinationTripDuration(destination, locale)}</p>
          </div>

          <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
            <h2 className="mb-2 inline-flex items-center gap-2 text-base font-semibold text-amber-950">
              <AlertTriangle className="h-4 w-4" />
              {pick(locale, "Main reminder", "\u4e3b\u8981\u63d0\u9192")}
            </h2>
            <p className="text-sm leading-6 text-amber-900">{destinationSafetyTip(destination, locale)}</p>
          </div>
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="mb-3 inline-flex items-center gap-2 text-base font-semibold text-slate-900">
              <TentTree className="h-4 w-4" />
              {pick(locale, "Facilities", "\u8bbe\u65bd\u4fe1\u606f")}
            </h2>
            <div className="space-y-2 text-sm text-slate-700">
              <p className="inline-flex items-center gap-2">
                <Car className="h-4 w-4" />
                {isZh ? (destination.hasParking ? "\u53ef\u505c\u8f66" : "\u505c\u8f66\u4f4d\u8f83\u5c11") : destination.hasParking ? "Parking available" : "Parking is limited"}
              </p>
              <p className="inline-flex items-center gap-2">
                <Bath className="h-4 w-4" />
                {isZh ? (destination.hasToilet ? "\u6709\u516c\u5171\u5395\u6240" : "\u5395\u6240\u8f83\u5c11") : destination.hasToilet ? "Public toilet available" : "Limited toilet access"}
              </p>
              <p className="inline-flex items-center gap-2">
                <MapPinned className="h-4 w-4" />
                {pick(locale, "Suitable for half-day or full-day trips", "\u9002\u5408\u534a\u65e5\u6216\u4e00\u65e5\u5f80\u8fd4")}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 md:col-span-2">
            <h2 className="mb-3 inline-flex items-center gap-2 text-base font-semibold text-slate-900">
              <ShieldCheck className="h-4 w-4" />
              {pick(locale, "Family Safety Notes", "\u4eb2\u5b50\u5b89\u5168\u63d0\u793a")}
            </h2>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>{pick(locale, "Check weather and rain forecast before departure, especially for creek routes.", "\u51fa\u53d1\u524d\u8bf7\u68c0\u67e5\u5929\u6c14\u4e0e\u964d\u96e8\u60c5\u51b5\uff0c\u6d89\u6c34\u8def\u7ebf\u9700\u66f4\u8c28\u614e\u3002")}</li>
              <li>{pick(locale, "Keep young children in clear sight and use anti-slip shoes near water.", "\u4f4e\u9f84\u5b69\u5b50\u8bf7\u5168\u7a0b\u5728\u5bb6\u957f\u53ef\u89c6\u8303\u56f4\u5185\uff0c\u5efa\u8bae\u7a7f\u9632\u6ed1\u978b\u3002")}</li>
              <li>{pick(locale, "Carry water, sunscreen, and a small first-aid kit as a fixed checklist.", "\u8865\u6c34\u3001\u9632\u6652\u548c\u6025\u6551\u5305\u5efa\u8bae\u4f5c\u4e3a\u56fa\u5b9a\u6e05\u5355\u643a\u5e26\u3002")}</li>
            </ul>
          </div>
        </section>

        <section className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="inline-flex items-center gap-2 text-base font-semibold text-slate-900">
            <Backpack className="h-4 w-4" />
            {pick(locale, "Before Departure Checklist", "\u51fa\u53d1\u524d\u51c6\u5907\u6e05\u5355")}
          </h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {packingList.map((item) => (
              <div key={item} className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-5">
          <h2 className="mb-3 text-base font-semibold text-slate-900">{pick(locale, "Related Picks", "\u76f8\u5173\u63a8\u8350")}</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {related.map((item) => (
              <Link
                key={item.id}
                href={`/destinations/${item.id}`}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="h-28 bg-cover bg-center" style={{ backgroundImage: `url('${item.image}')` }} />
                <div className="p-3">
                  <p className="text-sm font-medium text-slate-900">{destinationName(item, locale)}</p>
                  <p className="mt-1 text-xs text-slate-600">
                    {destinationRegion(item, locale)} - {formatDistance(item.distanceKm, locale)} - {pick(locale, "Rating", "\u8bc4\u5206")} {item.rating.toFixed(1)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
