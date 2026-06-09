import Link from "next/link";
import { Pencil } from "lucide-react";
import { AuthSyncRequired } from "@/components/auth/auth-sync-required";
import { getAdminDestinations } from "@/features/admin/destinations";
import { getDestinationImage } from "@/features/destinations/images";
import { toChineseRegionName } from "@/lib/geo/region-names";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const scenarioLabelMap = {
  camping: "露营",
  creek: "溯溪",
  hiking: "徒步",
  picnic: "野餐"
} as const;

function formatDistance(distanceKm: number) {
  if (!distanceKm || distanceKm <= 0) return "距离待计算";
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
    <AuthSyncRequired
      title="目的地管理"
      description="请先使用管理员账号登录，然后管理全站目的地资料。"
      loginHref="/login?next=/admin/destinations"
    />
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
        <h1 className="text-2xl font-bold text-slate-900">{"目的地管理"}</h1>
        <p className="mt-2 text-sm text-slate-600">{"管理全站已发布的目的地资料，包括用户投稿审核通过后的地点。"}</p>

        <form className="mt-5 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-4">
          <input name="q" defaultValue={q} placeholder="搜索地点名称或城市" className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">{"搜索"}</button>
          <Link href="/admin/destinations" className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700">
            {"重置"}
          </Link>
        </form>

        <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3 text-sm text-slate-600">{"共 "} {destinations.length} {" 个目的地"}</div>
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
                    {"编辑"}
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
