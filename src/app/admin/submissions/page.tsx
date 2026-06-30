import { CheckCircle2, Pencil, XCircle } from "lucide-react";
import { approveSubmission, rejectSubmission, requestChangesSubmission } from "./actions";
import { getPendingSubmissions } from "@/features/submissions/repository";
import { toChineseRegionName } from "@/lib/geo/region-names";

const scenarioLabelMap = {
  camping: "\u9732\u8425",
  creek: "\u6eaf\u6eaa",
  hiking: "\u5f92\u6b65",
  picnic: "\u91ce\u9910"
} as const;

const difficultyLabelMap = {
  easy: "\u4f4e\u96be\u5ea6",
  moderate: "\u4e2d\u96be\u5ea6",
  hard: "\u9ad8\u96be\u5ea6"
} as const;

const safetyLabelMap = {
  low_risk: "\u4f4e\u98ce\u9669",
  medium_risk: "\u4e2d\u98ce\u9669",
  high_risk: "\u9ad8\u98ce\u9669"
} as const;

function formatDistance(distanceKm: number) {
  if (!distanceKm || distanceKm <= 0) return "\u8ddd\u79bb\u5f85\u8ba1\u7b97";
  return `${distanceKm}km`;
}

function formatAgeRange(minKidAge: number) {
  if (minKidAge >= 12) return "12\u5c81+";
  if (minKidAge >= 6) return "6-12\u5c81";
  if (minKidAge >= 3) return "3-6\u5c81";
  return "0-3\u5c81";
}

function formatRegion(item: { province?: string | null; provinceZh?: string | null; city: string; cityZh?: string | null }) {
  const province = item.provinceZh || toChineseRegionName(item.province);
  const city = item.cityZh || toChineseRegionName(item.city);
  if (!province || province === city) return city;
  return `${province} ${city}`;
}

export default async function AdminSubmissionsPage() {
  const submissions = await getPendingSubmissions();

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="qmd-container py-6">
        <h1 className="text-2xl font-bold text-slate-900">{"\u5730\u70b9\u5ba1\u6838"}</h1>
        <p className="mt-2 text-sm text-slate-600">{"\u7528\u6237\u63d0\u4ea4\u7684\u4eb2\u5b50\u6237\u5916\u5730\u70b9\u4f1a\u51fa\u73b0\u5728\u8fd9\u91cc\uff0c\u5ba1\u6838\u901a\u8fc7\u540e\u5c06\u53d1\u5e03\u5230\u76ee\u7684\u5730\u5217\u8868\u3002"}</p>

        {submissions.length === 0 ? (
          <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
            {"\u6682\u65e0\u5f85\u5ba1\u6838\u6295\u7a3f\u3002"}
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {submissions.map((item) => (
              <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-slate-500">{item.createdAt}</p>
                    <h2 className="mt-1 text-lg font-semibold text-slate-900">{item.nameZh || item.name}</h2>
                    <div className="mt-2 grid gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600 md:grid-cols-3">
                      <p>
                        <span className="font-semibold text-slate-800">{"\u6295\u7a3f\u7528\u6237\uff1a"}</span>
                        {item.userEmail || item.userName || item.userId}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-800">{"\u8054\u7cfb\u65b9\u5f0f\uff1a"}</span>
                        {item.contact || item.userEmail || "\u672a\u586b\u5199"}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-800">{"\u7528\u6237\u89d2\u8272\uff1a"}</span>
                        {item.userRole === "admin" ? "\u7ba1\u7406\u5458" : "\u666e\u901a\u7528\u6237"}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {formatRegion(item)} - {scenarioLabelMap[item.scenario]} - {difficultyLabelMap[item.difficulty]} - {safetyLabelMap[item.safety]}
                    </p>
                    {item.address ? <p className="mt-1 text-sm text-slate-600">{"\u5730\u5740\uff1a"}{item.address}</p> : null}
                  </div>
                  {item.imageUrl ? (
                    <div className="h-24 w-32 rounded-lg bg-cover bg-center" style={{ backgroundImage: `url('${item.imageUrl}')` }} />
                  ) : null}
                </div>

                <p className="mt-3 text-sm text-slate-700">{item.descriptionZh || item.description}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1">{"\u505c\u8f66\uff1a"}{item.hasParking ? "\u6709" : "\u672a\u786e\u8ba4"}</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1">{"\u6d17\u624b\u95f4\uff1a"}{item.hasToilet ? "\u6709" : "\u672a\u786e\u8ba4"}</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1">{"\u9002\u5408\u5e74\u9f84\uff1a"}{formatAgeRange(item.minKidAge)}</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1">{"\u8ddd\u79bb\uff1a"}{formatDistance(item.distanceKm)}</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1">
                    {"\u5750\u6807\uff1a"}{item.latitude ?? "-"}, {item.longitude ?? "-"}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4">
                  <form action={approveSubmission}>
                    <input type="hidden" name="id" value={item.id} />
                    <button className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white">
                      <CheckCircle2 className="h-4 w-4" />
                      {"\u5ba1\u6838\u901a\u8fc7\u5e76\u53d1\u5e03"}
                    </button>
                  </form>

                  <div className="grid gap-2 md:grid-cols-2">
                    <form action={requestChangesSubmission} className="flex flex-wrap gap-2">
                      <input type="hidden" name="id" value={item.id} />
                      <input name="review_note" placeholder={"\u9700\u4fee\u6539\u7684\u5185\u5bb9"} className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                      <button className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
                        <Pencil className="h-4 w-4" />
                        {"\u9700\u4fee\u6539"}
                      </button>
                    </form>
                    <form action={rejectSubmission} className="flex flex-wrap gap-2">
                      <input type="hidden" name="id" value={item.id} />
                      <input name="review_note" placeholder={"\u672a\u901a\u8fc7\u539f\u56e0"} className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                      <button className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-rose-700">
                        <XCircle className="h-4 w-4" />
                        {"\u672a\u901a\u8fc7"}
                      </button>
                    </form>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
