import Link from "next/link";
import { Bath, Car, Heart, Star } from "lucide-react";
import { getDestinationImage } from "@/features/destinations/images";
import { destinationName, destinationRegion, destinationScenario } from "@/features/destinations/presenter";
import { getMyFavoriteDestinations } from "@/features/destinations/repository";
import { getMyProfile } from "@/features/profiles/repository";
import { DEFAULT_HOME_CITY, withDistanceFromCity } from "@/lib/geo/distance";
import { getLocale, pick } from "@/lib/i18n/server";

function formatDistance(distanceKm: number, locale: "en" | "zh") {
  if (!distanceKm || distanceKm <= 0) return pick(locale, "Distance pending", "\u8ddd\u79bb\u5f85\u8ba1\u7b97");
  return pick(locale, `About ${distanceKm}km away`, `\u7ea6 ${distanceKm}km`);
}

export default async function FavoritesPage() {
  const [locale, profile, favoriteDestinations] = await Promise.all([getLocale(), getMyProfile(), getMyFavoriteDestinations()]);
  const homeCity = profile?.homeCity?.trim() || DEFAULT_HOME_CITY;
  const list = withDistanceFromCity(favoriteDestinations, homeCity);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <div className="mb-5">
          <p className="text-sm text-slate-500">{"我的收藏"}</p>
          <h1 className="inline-flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Heart className="h-6 w-6 text-rose-600" />
            {pick(locale, "My Favorites", "\u6211\u7684\u6536\u85cf")}
          </h1>
        </div>

        {list.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-700">
            <p className="font-medium">{pick(locale, "No favorites yet.", "\u8fd8\u6ca1\u6709\u6536\u85cf\u3002")}</p>
            <p className="mt-1 text-sm text-slate-600">
              {pick(locale, "Sign in and save places from the destination list or detail page.", "\u767b\u5f55\u540e\u53ef\u5728\u5217\u8868\u9875\u6216\u8be6\u60c5\u9875\u6536\u85cf\u76ee\u7684\u5730\u3002")}
            </p>
            <Link href="/destinations" className="mt-4 inline-flex rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white">
              {pick(locale, "Explore destinations", "\u53bb\u770b\u76ee\u7684\u5730")}
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {list.map((item) => {
              const image = getDestinationImage(item);
              return (
                <Link
                  key={item.id}
                  href={`/destinations/${item.id}`}
                  className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                >
                  <div className="relative h-44 overflow-hidden bg-slate-100">
                    <img
                      src={image.src}
                      alt={destinationName(item, locale)}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition duration-300 hover:scale-105"
                    />
                    {image.pending ? (
                      <span className="absolute left-3 top-3 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 shadow-sm">
                        {pick(locale, "Image pending", "\u56fe\u7247\u5f85\u8865\u5145")}
                      </span>
                    ) : null}
                  </div>
                <div className="flex flex-1 flex-col space-y-3 p-4">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      {destinationScenario(item, locale)}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                      <Star className="h-3.5 w-3.5 fill-current text-amber-500" />
                      {item.rating.toFixed(1)}
                    </span>
                  </div>

                  <h2 className="text-base font-semibold text-slate-900">{destinationName(item, locale)}</h2>
                  <p className="text-sm text-slate-600">{destinationRegion(item, locale)} - {formatDistance(item.distanceKm, locale)}</p>

                  <div className="mt-auto flex items-center gap-4 border-t border-slate-100 pt-3 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <Car className="h-3.5 w-3.5" />
                      {item.hasParking ? "\u53ef\u505c\u8f66" : "\u505c\u8f66\u4e00\u822c"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Bath className="h-3.5 w-3.5" />
                      {item.hasToilet ? "\u6709\u5395\u6240" : "\u5395\u6240\u8f83\u5c11"}
                    </span>
                  </div>
                </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
