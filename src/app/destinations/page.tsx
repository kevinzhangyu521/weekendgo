import Link from "next/link";
import { Bath, Car, SlidersHorizontal, Star } from "lucide-react";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { filterDestinations, parseFilters } from "@/features/destinations/filter";
import {
  destinationDescription,
  destinationDifficultyShort,
  destinationName,
  destinationRegion,
  destinationSafety,
  destinationScenario
} from "@/features/destinations/presenter";
import { getAllDestinations } from "@/features/destinations/repository";
import { getMyProfile } from "@/features/profiles/repository";
import { DEFAULT_HOME_CITY, withDistanceFromCity } from "@/lib/geo/distance";
import { getLocale, pick } from "@/lib/i18n/server";

const scenarioLabelMap = {
  all: { en: "All", zh: "\u5168\u90e8" },
  camping: { en: "Camping", zh: "\u9732\u8425" },
  creek: { en: "Creek", zh: "\u6eaf\u6eaa" },
  hiking: { en: "Hiking", zh: "\u5f92\u6b65" },
  picnic: { en: "Picnic", zh: "\u91ce\u9910" }
} as const;

const difficultyLabelMap = {
  all: { en: "All Levels", zh: "\u5168\u90e8\u96be\u5ea6" },
  easy: { en: "Easy", zh: "\u4f4e\u96be\u5ea6" },
  moderate: { en: "Moderate", zh: "\u4e2d\u96be\u5ea6" },
  hard: { en: "Hard", zh: "\u9ad8\u96be\u5ea6" }
} as const;

function formatDistance(distanceKm: number, locale: "en" | "zh") {
  if (!distanceKm || distanceKm <= 0) return pick(locale, "Distance pending", "\u8ddd\u79bb\u5f85\u8ba1\u7b97");
  return pick(locale, `About ${distanceKm}km away`, `\u8ddd\u79bb\u5e38\u4f4f\u57ce\u5e02\u7ea6 ${distanceKm}km`);
}

export default async function DestinationsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getLocale();
  const params = await searchParams;
  const filters = parseFilters(params);
  const profile = await getMyProfile();
  const homeCity = profile?.homeCity?.trim() || DEFAULT_HOME_CITY;
  const itemsWithDistance = withDistanceFromCity(await getAllDestinations(), homeCity);
  const list = filterDestinations(itemsWithDistance, filters);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <div className="mb-5">
          <p className="text-sm text-slate-500">{pick(locale, "\u6816\u7f8e\u5730 Destinations", "\u6816\u7f8e\u5730\u76ee\u7684\u5730")}</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{pick(locale, "Family-Friendly Weekend Picks", "\u4eb2\u5b50\u5468\u672b\u63a8\u8350")}</h1>
        </div>

        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-3 md:p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
            <SlidersHorizontal className="h-4 w-4" />
            {pick(locale, "Quick Filters", "\u5feb\u901f\u7b5b\u9009")}
          </div>

          <div className="flex flex-wrap gap-2">
            {Object.entries(scenarioLabelMap).map(([value, label]) => (
              <Link
                key={value}
                href={`/destinations?scenario=${value}&difficulty=${filters.difficulty}&maxDistance=${filters.maxDistanceKm}&needParking=${filters.needParking}&needToilet=${filters.needToilet}`}
                className={`rounded-full px-3 py-1.5 text-sm ${
                  filters.scenario === value ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700"
                }`}
              >
                {label.zh}
              </Link>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(difficultyLabelMap).map(([value, label]) => (
              <Link
                key={value}
                href={`/destinations?scenario=${filters.scenario}&difficulty=${value}&maxDistance=${filters.maxDistanceKm}&needParking=${filters.needParking}&needToilet=${filters.needToilet}`}
                className={`rounded-full px-3 py-1.5 text-sm ${
                  filters.difficulty === value ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-700"
                }`}
              >
                {label.zh}
              </Link>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {[30, 50, 80, 120].map((km) => (
              <Link
                key={km}
                href={`/destinations?scenario=${filters.scenario}&difficulty=${filters.difficulty}&maxDistance=${km}&needParking=${filters.needParking}&needToilet=${filters.needToilet}`}
                className={`rounded-full px-3 py-1.5 text-sm ${
                  filters.maxDistanceKm === km ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-700"
                }`}
              >
                {km}km{"\u5185"}
              </Link>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/destinations?scenario=${filters.scenario}&difficulty=${filters.difficulty}&maxDistance=${filters.maxDistanceKm}&needParking=${!filters.needParking}&needToilet=${filters.needToilet}`}
              className={`rounded-full px-3 py-1.5 text-sm ${
                filters.needParking ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              {pick(locale, "Parking Needed", "\u9700\u8981\u505c\u8f66")}
            </Link>
            <Link
              href={`/destinations?scenario=${filters.scenario}&difficulty=${filters.difficulty}&maxDistance=${filters.maxDistanceKm}&needParking=${filters.needParking}&needToilet=${!filters.needToilet}`}
              className={`rounded-full px-3 py-1.5 text-sm ${
                filters.needToilet ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              {pick(locale, "Toilet Needed", "\u9700\u8981\u5395\u6240")}
            </Link>
          </div>
        </div>

        <div className="mb-3 text-sm text-slate-600">
          {pick(locale, "Results", "\u7ed3\u679c")}: {list.length} - {pick(locale, `Distance calculated from ${homeCity}`, `\u8ddd\u79bb\u6309\u5e38\u4f4f\u57ce\u5e02\u300c${homeCity}\u300d\u8ba1\u7b97`)}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
              <Link href={`/destinations/${item.id}`} className="block h-44 bg-cover bg-center" style={{ backgroundImage: `url('${item.image}')` }} />
              <div className="space-y-3 p-4">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    {destinationScenario(item, locale)}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                      <Star className="h-3.5 w-3.5 fill-current text-amber-500" />
                      {item.rating.toFixed(1)}
                    </span>
                    <FavoriteButton destinationId={item.id} size="sm" />
                  </div>
                </div>

                <h2 className="text-base font-semibold text-slate-900">
                  <Link href={`/destinations/${item.id}`} className="hover:underline">
                    {destinationName(item, locale)}
                  </Link>
                </h2>
                <p className="line-clamp-2 text-sm text-slate-600">{destinationDescription(item, locale)}</p>
                <p className="text-sm text-slate-600">
                  {destinationRegion(item, locale)} - {formatDistance(item.distanceKm, locale)} - {destinationDifficultyShort(item, locale)} - {destinationSafety(item, locale)}
                </p>

                <div className="flex items-center gap-4 border-t border-slate-100 pt-3 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1">
                    <Car className="h-3.5 w-3.5" />
                    {item.hasParking ? "\u53ef\u505c\u8f66" : "\u505c\u8f66\u4e00\u822c"}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Bath className="h-3.5 w-3.5" />
                    {item.hasToilet ? "\u6709\u5395\u6240" : "\u5395\u6240\u8f83\u5c11"}
                  </span>
                  <span>{item.minKidAge}{"\u5c81+"}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
