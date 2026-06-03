import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { getAdminDestinations } from "@/features/admin/destinations";

const scenarioLabelMap = {
  camping: "\u9732\u8425",
  creek: "\u6eaf\u6eaa",
  hiking: "\u5f92\u6b65",
  picnic: "\u91ce\u9910"
} as const;

function formatDistance(distanceKm: number) {
  if (!distanceKm || distanceKm <= 0) return "\u8ddd\u79bb\u5f85\u8ba1\u7b97";
  return `${distanceKm}km`;
}

export default async function AdminDestinationsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = String(params.q ?? "");
  const destinations = await getAdminDestinations(q);
  if (!destinations) notFound();

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <p className="text-sm text-slate-500">{"\u6816\u7f8e\u5730 Admin"}</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">{"\u76ee\u7684\u5730\u7ba1\u7406"}</h1>
        <p className="mt-2 text-sm text-slate-600">{"\u7ba1\u7406\u5168\u7ad9\u5df2\u53d1\u5e03\u7684\u76ee\u7684\u5730\u8d44\u6599\uff0c\u5305\u62ec\u7528\u6237\u6295\u7a3f\u5ba1\u6838\u901a\u8fc7\u540e\u7684\u5730\u70b9\u3002"}</p>

        <form className="mt-5 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-4">
          <input name="q" defaultValue={q} placeholder={"\u641c\u7d22\u5730\u70b9\u540d\u79f0\u6216\u57ce\u5e02"} className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">{"\u641c\u7d22"}</button>
          <Link href="/admin/destinations" className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700">
            {"\u91cd\u7f6e"}
          </Link>
        </form>

        <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3 text-sm text-slate-600">{"\u5171 "} {destinations.length} {" \u4e2a\u76ee\u7684\u5730"}</div>
          <div className="divide-y divide-slate-100">
            {destinations.map((item) => (
              <article key={item.id} className="grid gap-3 p-4 md:grid-cols-[96px_1fr_auto] md:items-center">
                <div className="h-20 rounded-lg bg-slate-100 bg-cover bg-center" style={{ backgroundImage: item.image ? `url('${item.image}')` : undefined }} />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-slate-900">{item.nameZh || item.name}</h2>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{item.source}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    {item.cityZh || item.city} - {scenarioLabelMap[item.scenario]} - {formatDistance(item.distanceKm)}
                  </p>
                  <p className="mt-1 line-clamp-1 text-sm text-slate-500">{item.descriptionZh || item.description}</p>
                </div>
                <Link href={`/admin/destinations/${item.id}/edit`} className="inline-flex items-center justify-center gap-1 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-medium text-emerald-700">
                  <Pencil className="h-4 w-4" />
                  {"\u7f16\u8f91"}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
