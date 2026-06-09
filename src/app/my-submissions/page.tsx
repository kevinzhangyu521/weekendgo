import Link from "next/link";
import { Lock, Pencil, RotateCcw, Trash2, Unlock } from "lucide-react";
import { AuthSyncRequired } from "@/components/auth/auth-sync-required";
import { createClient } from "@/lib/supabase/server";
import { getMyNotifications } from "@/features/notifications/repository";
import { getMySubmissions, purgeExpiredDeletedSubmissions } from "@/features/submissions/repository";
import type { SpotSubmission } from "@/features/submissions/types";
import { toChineseRegionName } from "@/lib/geo/region-names";
import { deleteSubmission, lockSubmission, restoreSubmission, unlockSubmission } from "./actions";

const statusMap = {
  pending: {
    label: "\u5f85\u5ba1\u6838",
    className: "bg-amber-50 text-amber-700 ring-amber-200",
    message: "\u4f60\u7684\u63a8\u8350\u5df2\u63d0\u4ea4\uff0c\u7ba1\u7406\u5458\u6b63\u5728\u5ba1\u6838\u3002"
  },
  approved: {
    label: "\u5df2\u901a\u8fc7",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    message: "\u5ba1\u6838\u5df2\u901a\u8fc7\uff0c\u5730\u70b9\u5df2\u53d1\u5e03\u5230\u76ee\u7684\u5730\u5217\u8868\u3002"
  },
  rejected: {
    label: "\u672a\u901a\u8fc7",
    className: "bg-rose-50 text-rose-700 ring-rose-200",
    message: "\u8fd9\u6761\u63a8\u8350\u6682\u672a\u901a\u8fc7\u5ba1\u6838\uff0c\u8bf7\u67e5\u770b\u7ba1\u7406\u5458\u53cd\u9988\u3002"
  }
} as const;

function getDeleteCountdown(deletedAt: string | null) {
  if (!deletedAt) return "\u5269\u4f59 24 \u5c0f\u65f6";

  const expiresAt = new Date(deletedAt).getTime() + 24 * 60 * 60 * 1000;
  const remainingMs = Math.max(0, expiresAt - Date.now());
  const totalMinutes = Math.ceil(remainingMs / (60 * 1000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (totalMinutes <= 0) return "\u5373\u5c06\u6c38\u4e45\u5220\u9664";
  if (hours <= 0) return `\u5269\u4f59 ${minutes} \u5206\u949f`;
  if (minutes === 0) return `\u5269\u4f59 ${hours} \u5c0f\u65f6`;
  return `\u5269\u4f59 ${hours} \u5c0f\u65f6 ${minutes} \u5206\u949f`;
}

function formatRegion(item: SpotSubmission) {
  const province = item.provinceZh || toChineseRegionName(item.province);
  const city = item.cityZh || toChineseRegionName(item.city);
  if (!province || province === city) return city;
  return `${province} ${city}`;
}

function SubmissionCard({ item, deleted = false }: { item: SpotSubmission; deleted?: boolean }) {
  const status = statusMap[item.status];
  const canEdit = !deleted && !item.isLocked && item.status !== "approved";

  return (
    <article className={`rounded-xl border bg-white p-5 shadow-sm ${deleted ? "border-slate-200 opacity-80" : "border-slate-200"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-slate-500">{item.createdAt}</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">{item.nameZh || item.name}</h2>
          <p className="mt-1 text-sm text-slate-600">{formatRegion(item)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {item.isLocked ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
              <Lock className="h-3.5 w-3.5" />
              {"\u5df2\u9501\u5b9a"}
            </span>
          ) : null}
          {deleted ? (
            <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">{getDeleteCountdown(item.deletedAt)}</span>
          ) : (
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${status.className}`}>{status.label}</span>
          )}
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-700">
        {deleted ? `\u8fd9\u6761\u6295\u7a3f\u5df2\u79fb\u5230\u5df2\u5220\u9664\u5217\u8868\uff0c${getDeleteCountdown(item.deletedAt)}\u540e\u5c06\u6c38\u4e45\u5220\u9664\uff0c\u671f\u95f4\u4ecd\u53ef\u6062\u590d\u3002` : status.message}
      </p>
      {item.status === "rejected" && !deleted ? (
        <div className="mt-3 rounded-lg border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700">
          <p className="font-semibold">{"\u7ba1\u7406\u5458\u53cd\u9988"}</p>
          <p className="mt-1">{item.reviewNote || "\u672a\u586b\u5199\u5177\u4f53\u539f\u56e0\uff0c\u53ef\u4fee\u6539\u4fe1\u606f\u540e\u518d\u6b21\u63d0\u4ea4\u3002"}</p>
        </div>
      ) : null}
      {item.status === "approved" && !deleted ? (
        <Link href="/destinations" className="mt-3 inline-flex text-sm font-medium text-emerald-700 hover:underline">
          {"\u53bb\u76ee\u7684\u5730\u5217\u8868\u67e5\u770b"}
        </Link>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        {deleted ? (
          <form action={restoreSubmission}>
            <input type="hidden" name="id" value={item.id} />
            <button className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-medium text-emerald-700">
              <RotateCcw className="h-4 w-4" />
              {"\u6062\u590d\u6295\u7a3f"}
            </button>
          </form>
        ) : (
          <>
            {canEdit ? (
              <Link href={`/my-submissions/${item.id}/edit`} className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-medium text-emerald-700">
                <Pencil className="h-4 w-4" />
                {"\u4fee\u6539\u6295\u7a3f"}
              </Link>
            ) : null}
            <form action={item.isLocked ? unlockSubmission : lockSubmission}>
              <input type="hidden" name="id" value={item.id} />
              <button className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
                {item.isLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                {item.isLocked ? "\u89e3\u9501" : "\u9501\u5b9a"}
              </button>
            </form>
            <form action={deleteSubmission}>
              <input type="hidden" name="id" value={item.id} />
              <button
                disabled={item.isLocked}
                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
                title={item.isLocked ? "\u5df2\u9501\u5b9a\u7684\u6295\u7a3f\u9700\u5148\u89e3\u9501\u624d\u80fd\u5220\u9664" : "\u79fb\u5230\u5df2\u5220\u9664\u5217\u8868"}
              >
                <Trash2 className="h-4 w-4" />
                {"\u79fb\u5230\u5df2\u5220\u9664"}
              </button>
            </form>
          </>
        )}
      </div>
    </article>
  );
}

export default async function MySubmissionsPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <AuthSyncRequired
        title="我的投稿"
        description="请先登录，然后查看你提交的地点审核结果。"
        loginHref="/login?next=/my-submissions"
      />
    );
  }

  await purgeExpiredDeletedSubmissions();
  const submissions = await getMySubmissions();
  const notifications = await getMyNotifications(3);
  const activeSubmissions = submissions.filter((item) => !item.deletedAt);
  const deletedSubmissions = submissions.filter((item) => item.deletedAt);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-4xl px-4 py-6 md:px-6">
        <h1 className="text-2xl font-bold text-slate-900">{"\u6211\u7684\u6295\u7a3f"}</h1>
        <p className="mt-2 text-sm text-slate-600">{"\u8fd9\u91cc\u4f1a\u663e\u793a\u4f60\u63a8\u8350\u5730\u70b9\u7684\u5ba1\u6838\u8fdb\u5ea6\u3001\u7ba1\u7406\u5458\u53cd\u9988\uff0c\u4e5f\u53ef\u4ee5\u9501\u5b9a\u6216\u79fb\u52a8\u5230\u5df2\u5220\u9664\u5217\u8868\u3002"}</p>

        {notifications.length > 0 ? (
          <section className="mt-5 space-y-2 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
            <h2 className="text-sm font-bold text-emerald-900">{"最新通知"}</h2>
            {notifications.map((item) => (
              <div key={item.id} className="rounded-lg bg-white/80 p-3 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">{item.title}</p>
                <p className="mt-1">{item.body}</p>
              </div>
            ))}
          </section>
        ) : null}

        {activeSubmissions.length === 0 ? (
          <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
            <p className="font-medium text-slate-900">{"\u8fd8\u6ca1\u6709\u6709\u6548\u6295\u7a3f\u3002"}</p>
            <Link href="/submit-spot" className="mt-3 inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
              {"\u53bb\u63a8\u8350\u5730\u70b9"}
            </Link>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {activeSubmissions.map((item) => (
              <SubmissionCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {deletedSubmissions.length > 0 ? (
          <section className="mt-8">
            <h2 className="text-base font-bold text-slate-900">{"\u5df2\u5220\u9664\u6295\u7a3f"}</h2>
            <p className="mt-1 text-sm text-slate-600">{"\u5df2\u5220\u9664\u6295\u7a3f\u4f1a\u4fdd\u7559 24 \u5c0f\u65f6\uff0c\u8d85\u65f6\u540e\u5c06\u6c38\u4e45\u5220\u9664\uff1b\u5728\u5012\u8ba1\u65f6\u7ed3\u675f\u524d\u4f60\u53ef\u4ee5\u6062\u590d\u3002"}</p>
            <div className="mt-4 space-y-4">
              {deletedSubmissions.map((item) => (
                <SubmissionCard key={item.id} item={item} deleted />
              ))}
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}
