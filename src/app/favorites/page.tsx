import Link from "next/link";
import { Bath, Car, Heart, Star } from "lucide-react";
import { destinationCity, destinationName, destinationScenario } from "@/features/destinations/presenter";
import { getMyFavoriteDestinations } from "@/features/destinations/repository";
import { getLocale, pick } from "@/lib/i18n/server";

export default async function FavoritesPage() {
  const locale = await getLocale();
  const list = await getMyFavoriteDestinations();

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <div className="mb-5">
          <p className="text-sm text-slate-500">WeekendGo</p>
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
            {list.map((item) => (
              <Link
                key={item.id}
                href={`/destinations/${item.id}`}
                className="block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="h-44 bg-cover bg-center" style={{ backgroundImage: `url('${item.image}')` }} />
                <div className="space-y-3 p-4">
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
                  <p className="text-sm text-slate-600">{destinationCity(item, locale)} - {item.distanceKm}km</p>

                  <div className="flex items-center gap-4 border-t border-slate-100 pt-3 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <Car className="h-3.5 w-3.5" />
                      {locale === "zh" ? (item.hasParking ? "\u53ef\u505c\u8f66" : "\u505c\u8f66\u4e00\u822c") : item.hasParking ? "Parking" : "Limited Parking"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Bath className="h-3.5 w-3.5" />
                      {locale === "zh" ? (item.hasToilet ? "\u6709\u5395\u6240" : "\u5395\u6240\u8f83\u5c11") : item.hasToilet ? "Toilet" : "Limited Toilet"}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
