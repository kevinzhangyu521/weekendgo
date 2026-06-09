import Link from "next/link";
import { getAdminDestinationById } from "@/features/admin/destinations";
import { EditDestinationForm } from "./edit-destination-form";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function AdminEditUnavailable() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        <div className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-amber-700">{"\u6682\u65f6\u65e0\u6cd5\u7f16\u8f91"}</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">{"\u6ca1\u6709\u627e\u5230\u8fd9\u4e2a\u76ee\u7684\u5730\uff0c\u6216\u7ba1\u7406\u5458\u6743\u9650\u672a\u751f\u6548"}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {"\u8bf7\u5148\u786e\u8ba4\u5df2\u767b\u5f55\u7ba1\u7406\u5458\u8d26\u53f7\u3002\u5982\u679c\u4f60\u521a\u521a\u767b\u5f55\uff0c\u8bf7\u5237\u65b0\u9875\u9762\u6216\u91cd\u65b0\u767b\u5f55\u540e\u518d\u8bd5\u3002"}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/admin/destinations" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
              {"\u8fd4\u56de\u76ee\u7684\u5730\u7ba1\u7406"}
            </Link>
            <Link href="/login?next=/admin/destinations" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
              {"\u91cd\u65b0\u767b\u5f55"}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default async function AdminEditDestinationPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getAdminDestinationById(id);
  if (!item) return <AdminEditUnavailable />;

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-3xl px-4 py-6 md:px-6">
        <Link href="/admin/destinations" className="text-sm text-emerald-700 hover:underline">
          {"\u8fd4\u56de\u76ee\u7684\u5730\u7ba1\u7406"}
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">{"\u7f16\u8f91\u76ee\u7684\u5730"}</h1>
        <p className="mt-2 text-sm text-slate-600">{"\u4fee\u6539\u540e\u4f1a\u7acb\u5373\u5f71\u54cd\u524d\u53f0\u76ee\u7684\u5730\u5217\u8868\u3001\u8be6\u60c5\u9875\u3001\u5730\u56fe\u548c\u8ba1\u5212\u9875\u3002"}</p>

        <EditDestinationForm item={item} />
      </section>
    </main>
  );
}
