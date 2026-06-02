import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminDestinationById } from "@/features/admin/destinations";
import { updateDestination } from "./actions";

const scenarios = [
  { value: "creek", label: "\u6eaf\u6eaa" },
  { value: "camping", label: "\u9732\u8425" },
  { value: "hiking", label: "\u5f92\u6b65" },
  { value: "picnic", label: "\u91ce\u9910" }
] as const;

const labelClass = "block text-sm font-bold text-slate-900";
const inputClass = "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm";

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

        <form action={updateDestination} encType="multipart/form-data" className="mt-5 space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <input type="hidden" name="id" value={item.id} />

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900">{"\u57fa\u672c\u4fe1\u606f"}</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <label className={labelClass}>
                {"\u540d\u79f0 *"}
                <input name="name" required defaultValue={item.nameZh || item.name} className={inputClass} />
              </label>
              <label className={labelClass}>
                {"\u57ce\u5e02 *"}
                <input name="city" required defaultValue={item.cityZh || item.city} className={inputClass} />
              </label>
            </div>
          </section>

          <section className="space-y-3 border-t border-slate-100 pt-5">
            <h2 className="text-base font-bold text-slate-900">{"\u5730\u70b9\u5c5e\u6027"}</h2>
            <div className="grid gap-3 md:grid-cols-3">
              <label className={labelClass}>
                {"\u573a\u666f"}
                <select name="scenario" defaultValue={item.scenario} className={inputClass}>
                  {scenarios.map((scenario) => (
                    <option key={scenario.value} value={scenario.value}>
                      {scenario.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className={labelClass}>
                {"\u96be\u5ea6"}
                <select name="difficulty" defaultValue={item.difficulty} className={inputClass}>
                  <option value="easy">{"\u4f4e\u96be\u5ea6"}</option>
                  <option value="moderate">{"\u4e2d\u96be\u5ea6"}</option>
                  <option value="hard">{"\u9ad8\u96be\u5ea6"}</option>
                </select>
              </label>
              <label className={labelClass}>
                {"\u98ce\u9669"}
                <select name="safety" defaultValue={item.safety} className={inputClass}>
                  <option value="low_risk">{"\u4f4e\u98ce\u9669"}</option>
                  <option value="medium_risk">{"\u4e2d\u98ce\u9669"}</option>
                  <option value="high_risk">{"\u9ad8\u98ce\u9669"}</option>
                </select>
              </label>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className={labelClass}>
                {"\u7eac\u5ea6"}
                <input name="latitude" type="number" step="0.000001" defaultValue={item.latitude} className={inputClass} />
              </label>
              <label className={labelClass}>
                {"\u7ecf\u5ea6"}
                <input name="longitude" type="number" step="0.000001" defaultValue={item.longitude} className={inputClass} />
              </label>
              <label className={labelClass}>
                {"\u8bc4\u5206"}
                <input name="rating" type="number" min="0" max="5" step="0.1" defaultValue={item.rating} className={inputClass} />
              </label>
              <label className={labelClass}>
                {"\u9002\u5408\u5e74\u9f84"}
                <input name="min_kid_age" type="number" min="0" defaultValue={item.minKidAge} className={inputClass} />
              </label>
            </div>
            <div className="flex flex-wrap gap-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              <label className="inline-flex items-center gap-2 font-semibold">
                <input name="has_parking" type="checkbox" defaultChecked={item.hasParking} />
                {"\u53ef\u505c\u8f66"}
              </label>
              <label className="inline-flex items-center gap-2 font-semibold">
                <input name="has_toilet" type="checkbox" defaultChecked={item.hasToilet} />
                {"\u6709\u5395\u6240"}
              </label>
            </div>
          </section>

          <section className="space-y-3 border-t border-slate-100 pt-5">
            <h2 className="text-base font-bold text-slate-900">{"\u56fe\u7247\u4e0e\u63cf\u8ff0"}</h2>
            {item.image ? <div className="h-40 rounded-lg bg-cover bg-center" style={{ backgroundImage: `url('${item.image}')` }} /> : null}
            <label className={labelClass}>
              {"\u66f4\u6362\u56fe\u7247"}
              <input name="image_file" type="file" accept="image/*" className={inputClass} />
              <span className="mt-1 block text-xs font-normal text-slate-500">{"\u4e0d\u9009\u65b0\u56fe\u7247\u65f6\uff0c\u4fdd\u7559\u539f\u56fe\u7247\u3002"}</span>
            </label>
            <label className={labelClass}>
              {"\u63cf\u8ff0 *"}
              <textarea name="description" required rows={4} defaultValue={item.descriptionZh || item.description} className={inputClass} />
            </label>
          </section>

          <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
            <button className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white">{"\u4fdd\u5b58\u4fee\u6539"}</button>
            <Link href="/admin/destinations" className="text-sm text-slate-600 hover:underline">
              {"\u53d6\u6d88"}
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
