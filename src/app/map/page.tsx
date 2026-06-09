import Link from "next/link";
import { MapPinned } from "lucide-react";
import { MapExplorerLoader } from "@/components/map/map-explorer-loader";
import { filterDestinations, parseFilters } from "@/features/destinations/filter";
import { getAllDestinations } from "@/features/destinations/repository";
import { getMyProfile } from "@/features/profiles/repository";
import { DEFAULT_HOME_CITY, withDistanceFromCity } from "@/lib/geo/distance";
import { getLocale, pick } from "@/lib/i18n/server";

export default async function MapPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [locale, params, profile, destinations] = await Promise.all([
    getLocale(),
    searchParams,
    getMyProfile(),
    getAllDestinations()
  ]);
  const filters = parseFilters(params);
  const homeCity = profile?.homeCity?.trim() || DEFAULT_HOME_CITY;
  const items = filterDestinations(withDistanceFromCity(destinations, homeCity), filters);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="inline-flex items-center gap-2 text-2xl font-bold text-slate-900">
              <MapPinned className="h-6 w-6 text-emerald-700" />
              {pick(locale, "Map Explorer", "\u5730\u56fe\u63a2\u7d22")}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Link href="/destinations" className="rounded-full bg-white px-3 py-1.5 text-slate-700 ring-1 ring-slate-200">
              {pick(locale, "List View", "\u5217\u8868\u89c6\u56fe")}
            </Link>
            <Link href="/" className="rounded-full bg-white px-3 py-1.5 text-slate-700 ring-1 ring-slate-200">
              {pick(locale, "Home", "\u9996\u9875")}
            </Link>
          </div>
        </div>

        <MapExplorerLoader items={items} locale={locale} />
      </section>
    </main>
  );
}
