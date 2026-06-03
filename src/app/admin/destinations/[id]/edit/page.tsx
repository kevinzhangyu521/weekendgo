import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminDestinationById } from "@/features/admin/destinations";
import { EditDestinationForm } from "./edit-destination-form";

export default async function AdminEditDestinationPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getAdminDestinationById(id);
  if (!item) notFound();

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-3xl px-4 py-6 md:px-6">
        <Link href="/admin/destinations" className="text-sm text-emerald-700 hover:underline">
          {"\u8fd4\u56de\u76ee\u7684\u5730\u7ba1\u7406"}
        </Link>
        <p className="mt-4 text-sm text-slate-500">WeekendGo Admin</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">{"\u7f16\u8f91\u76ee\u7684\u5730"}</h1>
        <p className="mt-2 text-sm text-slate-600">{"\u4fee\u6539\u540e\u4f1a\u7acb\u5373\u5f71\u54cd\u524d\u53f0\u76ee\u7684\u5730\u5217\u8868\u3001\u8be6\u60c5\u9875\u3001\u5730\u56fe\u548c\u8ba1\u5212\u9875\u3002"}</p>

        <EditDestinationForm item={item} />
      </section>
    </main>
  );
}
