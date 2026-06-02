import { CheckCircle2, XCircle } from "lucide-react";
import { approveSubmission, rejectSubmission } from "./actions";
import { getPendingSubmissions } from "@/features/submissions/repository";

export default async function AdminSubmissionsPage() {
  const submissions = await getPendingSubmissions();

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-5xl px-4 py-6 md:px-6">
        <p className="text-sm text-slate-500">WeekendGo Admin</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">地点投稿审核</h1>

        {submissions.length === 0 ? (
          <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">暂无待审核投稿。</div>
        ) : (
          <div className="mt-5 space-y-4">
            {submissions.map((item) => (
              <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-slate-500">{item.createdAt}</p>
                    <h2 className="mt-1 text-lg font-semibold text-slate-900">{item.nameZh || item.name}</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {item.cityZh || item.city} - {item.scenario} - {item.difficulty} - {item.safety}
                    </p>
                    {item.address ? <p className="mt-1 text-sm text-slate-600">地址：{item.address}</p> : null}
                  </div>
                  {item.imageUrl ? (
                    <div className="h-24 w-32 rounded-lg bg-cover bg-center" style={{ backgroundImage: `url('${item.imageUrl}')` }} />
                  ) : null}
                </div>

                <p className="mt-3 text-sm text-slate-700">{item.descriptionZh || item.description}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1">停车：{item.hasParking ? "有" : "未确认"}</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1">洗手间：{item.hasToilet ? "有" : "未确认"}</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1">孩子年龄：{item.minKidAge}岁+</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1">
                    坐标：{item.latitude ?? "-"}, {item.longitude ?? "-"}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <form action={approveSubmission}>
                    <input type="hidden" name="id" value={item.id} />
                    <button className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white">
                      <CheckCircle2 className="h-4 w-4" />
                      审核通过并发布
                    </button>
                  </form>
                  <form action={rejectSubmission} className="flex flex-wrap gap-2">
                    <input type="hidden" name="id" value={item.id} />
                    <input
                      name="review_note"
                      placeholder="拒绝原因"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                    <button className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-rose-700">
                      <XCircle className="h-4 w-4" />
                      拒绝
                    </button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
