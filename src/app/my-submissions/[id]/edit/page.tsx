import Link from "next/link";
import { notFound } from "next/navigation";
import { getEditableSubmission } from "@/features/submissions/repository";
import { updateSubmission } from "./actions";

const scenarios = [
  { value: "creek", label: "\u6eaf\u6eaa" },
  { value: "camping", label: "\u9732\u8425" },
  { value: "hiking", label: "\u5f92\u6b65" },
  { value: "picnic", label: "\u91ce\u9910" }
] as const;

const labelClass = "block text-sm font-bold text-slate-900";
const inputClass = "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm";

export default async function EditSubmissionPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getEditableSubmission(id);
  if (!item) notFound();

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-3xl px-4 py-6 md:px-6">
        <Link href="/my-submissions" className="text-sm text-emerald-700 hover:underline">
          {"\u8fd4\u56de\u6211\u7684\u6295\u7a3f"}
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">{"\u4fee\u6539\u6295\u7a3f"}</h1>
        <p className="mt-2 text-sm text-slate-600">{"\u4fdd\u5b58\u540e\u5c06\u91cd\u65b0\u8fdb\u5165\u5f85\u5ba1\u6838\u72b6\u6001\uff0c\u7ba1\u7406\u5458\u4f1a\u518d\u6b21\u5ba1\u6838\u3002"}</p>

        <form action={updateSubmission} className="mt-5 space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <input type="hidden" name="id" value={item.id} />

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900">{"\u57fa\u672c\u4fe1\u606f"}</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <label className={labelClass}>
                {"\u5730\u70b9\u540d\u79f0 *"}
                <input name="name" required defaultValue={item.nameZh || item.name} className={inputClass} />
              </label>
              <label className={labelClass}>
                {"\u57ce\u5e02 *"}
                <input name="city" required defaultValue={item.cityZh || item.city} className={inputClass} />
              </label>
            </div>
            <label className={labelClass}>
              {"\u5730\u5740/\u5b9a\u4f4d\u8bf4\u660e"}
              <input name="address" defaultValue={item.address ?? ""} className={inputClass} />
            </label>
          </section>

          <section className="space-y-3 border-t border-slate-100 pt-5">
            <h2 className="text-base font-bold text-slate-900">{"\u51fa\u884c\u4fe1\u606f"}</h2>
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
            <div className="grid gap-3 md:grid-cols-4">
              <label className={labelClass}>
                {"\u7eac\u5ea6"}
                <input name="latitude" type="number" step="0.000001" defaultValue={item.latitude ?? ""} className={inputClass} />
              </label>
              <label className={labelClass}>
                {"\u7ecf\u5ea6"}
                <input name="longitude" type="number" step="0.000001" defaultValue={item.longitude ?? ""} className={inputClass} />
              </label>
              <label className={labelClass}>
                {"\u8ddd\u79bb(km)"}
                <input name="distance_km" type="number" min="0" defaultValue={item.distanceKm} className={inputClass} />
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
                {"\u6709\u6d17\u624b\u95f4"}
              </label>
            </div>
          </section>

          <section className="space-y-3 border-t border-slate-100 pt-5">
            <h2 className="text-base font-bold text-slate-900">{"\u7167\u7247\u4e0e\u8bf4\u660e"}</h2>
            {item.imageUrl ? (
              <div>
                <p className="text-sm font-bold text-slate-900">{"\u5f53\u524d\u56fe\u7247"}</p>
                <div className="mt-2 h-40 rounded-lg bg-cover bg-center" style={{ backgroundImage: `url('${item.imageUrl}')` }} />
              </div>
            ) : null}
            <label className={labelClass}>
              {"\u66f4\u6362\u56fe\u7247"}
              <input name="image_file" type="file" accept="image/*" className={inputClass} />
              <span className="mt-1 block text-xs font-normal text-slate-500">{"\u4e0d\u9009\u65b0\u56fe\u7247\u65f6\uff0c\u4fdd\u7559\u539f\u56fe\u7247\u3002"}</span>
            </label>
            <label className={labelClass}>
              {"\u63a8\u8350\u7406\u7531/\u5b89\u5168\u63d0\u793a *"}
              <textarea name="description" required rows={4} defaultValue={item.descriptionZh || item.description} className={inputClass} />
            </label>
            <label className={labelClass}>
              {"\u8865\u5145\u8bf4\u660e"}
              <textarea name="description_zh" rows={3} defaultValue={item.descriptionZh ?? ""} className={inputClass} />
            </label>
          </section>

          <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
            <button className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white">
              {"\u4fdd\u5b58\u5e76\u91cd\u65b0\u63d0\u4ea4\u5ba1\u6838"}
            </button>
            <Link href="/my-submissions" className="text-sm text-slate-600 hover:underline">
              {"\u53d6\u6d88"}
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
