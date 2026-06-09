import Link from "next/link";
import { Pencil } from "lucide-react";
import { getAdminDestinations } from "@/features/admin/destinations";
import { getDestinationImage } from "@/features/destinations/images";
import { toChineseRegionName } from "@/lib/geo/region-names";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

function formatRegion(item: { province?: string | null; provinceZh?: string | null; city: string; cityZh?: string | null }) {
  const province = item.provinceZh || toChineseRegionName(item.province);
  const city = item.cityZh || toChineseRegionName(item.city);
  if (!province || province === city) return city;
  return `${province} ${city}`;
}

function AdminAccessRequired() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        <div className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-amber-700">{"\u9700\u8981\u7ba1\u7406\u5458\u6743\u9650"}</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">{"\u6682\u65f6\u65e0\u6cd5\u6253\u5f00\u76ee\u7684\u5730\u7ba1\u7406"}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {"页面没有读取到服务端管理员登录状态。你现在页眉显示账号，说明浏览器端可能已登录，但服务端权限 cookie 还没有同步。请点击下方按钮重新登录一次。"}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/login?next=/admin/destinations" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
              {"重新登录同步权限"}
            </Link>
            <Link href="/admin/submissions" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
              {"\u53bb\u5ba1\u6838\u6295\u7a3f"}
            </Link>
            <Link href="/" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
              {"\u8fd4\u56de\u9996\u9875"}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default async function AdminDestinationsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = String(params.q ?? "");
  const destinations = await getAdminDestinations(q);
  if (!destinations) return <AdminAccessRequired />;

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <h1 className="text-2xl font-bold text-slate-900">{"\u76ee\u7684\u5730\u7ba1\u7406"}</h1>
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
            {destinations.map((item) => {
              const image = getDestinationImage(item);
              return (
              <article key={item.id} className="grid gap-3 p-4 md:grid-cols-[96px_1fr_auto] md:items-center">
                <div className="relative h-20 overflow-hidden rounded-lg bg-slate-100 bg-cover bg-center" style={{ backgroundImage: `url('${image.src}')` }}>
                  {image.pending ? (
                    <span className="absolute left-1 top-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                      {"待补充"}
                    </span>
                  ) : null}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-slate-900">{item.nameZh || item.name}</h2>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{item.source}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    {formatRegion(item)} - {scenarioLabelMap[item.scenario]} - {formatDistance(item.distanceKm)}
                  </p>
                  <p className="mt-1 line-clamp-1 text-sm text-slate-500">{item.descriptionZh || item.description}</p>
                </div>
                <Link href={`/admin/destinations/${item.id}/edit`} className="inline-flex items-center justify-center gap-1 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-medium text-emerald-700">
                  <Pencil className="h-4 w-4" />
                  {"\u7f16\u8f91"}
                </Link>
              </article>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
