import Link from "next/link";
import { notFound } from "next/navigation";
import { Bath, Car, ChevronLeft, MapPinned, ShieldCheck, Star, TentTree } from "lucide-react";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { AddToPlanButton } from "@/components/plans/add-to-plan-button";
import {
  destinationCity,
  destinationDescription,
  destinationDifficulty,
  destinationName,
  destinationSafety,
  destinationScenario
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
            <div className="flex items-center gap-2">
              <FavoriteButton destinationId={destination.id} />
              <AddToPlanButton destinationId={destination.id} locale={locale} />
              <span className="text-sm text-slate-600">{pick(locale, "Save this destination", "\u6536\u85cf\u6216\u52a0\u5165\u8ba1\u5212")}</span>
            </div>
            <p className="text-slate-600">{destinationDescription(destination, locale)}</p>

            <div className="grid gap-3 text-sm text-slate-700 md:grid-cols-4">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">{pick(locale, "City", "\u57ce\u5e02")}</p>
                <p className="mt-1 font-medium">{destinationCity(destination, locale)}</p>
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
          <h2 className="text-base font-semibold text-slate-900">{pick(locale, "Family Reviews (Sample)", "\u7528\u6237\u8bc4\u4ef7\uff08\u793a\u4f8b\uff09")}</h2>
          <div className="mt-3 space-y-3">
            <article className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              <p className="font-medium text-slate-900">{pick(locale, "Great for young kids", "\u5f88\u9002\u5408\u5e74\u9f84\u8f83\u5c0f\u7684\u5b69\u5b50")}</p>
              <p className="mt-1">{pick(locale, "We arrived in the morning and everything felt organized and relaxed.", "\u4e0a\u5348\u5230\u8fbe\uff0c\u6574\u4f53\u79e9\u5e8f\u5f88\u597d\uff0c\u5b69\u5b50\u73a9\u5f97\u5f88\u8f7b\u677e\u3002")}</p>
            </article>
            <article className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              <p className="font-medium text-slate-900">{pick(locale, "Good for first-time families", "\u5bf9\u65b0\u624b\u5bb6\u5ead\u975e\u5e38\u53cb\u597d")}</p>
              <p className="mt-1">{pick(locale, "Easy route, practical facilities, and manageable pace for children.", "\u8def\u7ebf\u4e0d\u590d\u6742\uff0c\u8bbe\u65bd\u5b9e\u7528\uff0c\u8282\u594f\u5b69\u5b50\u4e5f\u80fd\u8ddf\u4e0a\u3002")}</p>
            </article>
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
                    {destinationCity(item, locale)} - {formatDistance(item.distanceKm, locale)} - {pick(locale, "Rating", "\u8bc4\u5206")} {item.rating.toFixed(1)}
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
