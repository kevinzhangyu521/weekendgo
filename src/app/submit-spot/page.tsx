"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const scenarios = [
  { value: "creek", label: "\u6eaf\u6eaa" },
  { value: "camping", label: "\u9732\u8425" },
  { value: "hiking", label: "\u5f92\u6b65" },
  { value: "picnic", label: "\u91ce\u9910" }
];

export default function SubmitSpotPage() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setNeedsLogin(false);
    setSubmitted(false);
    setMessage("");
    setError("");

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      setNeedsLogin(true);
      setError("\u8bf7\u5148\u767b\u5f55\u540e\u518d\u63d0\u4ea4\u5730\u70b9\u3002");
      setLoading(false);
      return;
    }

    const payload = {
      user_id: user.id,
      name: String(form.get("name") ?? "").trim(),
      name_zh: String(form.get("name_zh") ?? "").trim() || null,
      city: String(form.get("city") ?? "").trim(),
      city_zh: String(form.get("city_zh") ?? "").trim() || null,
      address: String(form.get("address") ?? "").trim() || null,
      latitude: Number(form.get("latitude") || "0") || null,
      longitude: Number(form.get("longitude") || "0") || null,
      scenario: String(form.get("scenario") ?? "creek"),
      difficulty: String(form.get("difficulty") ?? "easy"),
      safety: String(form.get("safety") ?? "low_risk"),
      distance_km: Number(form.get("distance_km") || "0"),
      min_kid_age: Number(form.get("min_kid_age") || "0"),
      has_parking: form.get("has_parking") === "on",
      has_toilet: form.get("has_toilet") === "on",
      image_url: String(form.get("image_url") ?? "").trim() || null,
      description: String(form.get("description") ?? "").trim(),
      description_zh: String(form.get("description_zh") ?? "").trim() || null
    };

    if (!payload.name || !payload.city || !payload.description) {
      setError("\u8bf7\u81f3\u5c11\u586b\u5199\u5730\u70b9\u540d\u79f0\u3001\u57ce\u5e02\u548c\u63a8\u8350\u7406\u7531\u3002");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("spot_submissions").insert(payload);
    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    formElement.reset();
    setSubmitted(true);
    setMessage("\u63d0\u4ea4\u6210\u529f\uff0c\u7ba1\u7406\u5458\u5ba1\u6838\u901a\u8fc7\u540e\u4f1a\u51fa\u73b0\u5728\u76ee\u7684\u5730\u5217\u8868\u3002");
    window.setTimeout(() => router.push("/"), 2000);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-3xl px-4 py-6 md:px-6">
        <p className="text-sm text-slate-500">WeekendGo 共建</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">推荐一个亲子户外地点</h1>
        <p className="mt-2 text-sm text-slate-600">提交后会进入审核，审核通过才会展示给其他家庭。</p>

        {submitted ? (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5" />
              <div>
                <p className="font-semibold">提交成功</p>
                <p className="mt-1 text-sm">{message}</p>
                <p className="mt-1 text-xs">页面将自动返回首页。</p>
                <Link href="/" className="mt-3 inline-flex rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white">
                  返回首页
                </Link>
              </div>
            </div>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 rounded-xl border border-slate-200 bg-white p-5">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              地点名称 *
              <input name="name" required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              中文名
              <input name="name_zh" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              城市 *
              <input name="city" required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              中文城市
              <input name="city_zh" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </label>
          </div>

          <label className="block text-sm font-medium text-slate-700">
            地址/定位说明
            <input name="address" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </label>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="text-sm font-medium text-slate-700">
              场景
              <select name="scenario" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                {scenarios.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              难度
              <select name="difficulty" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <option value="easy">低难度</option>
                <option value="moderate">中难度</option>
                <option value="hard">高难度</option>
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              风险
              <select name="safety" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <option value="low_risk">低风险</option>
                <option value="medium_risk">中风险</option>
                <option value="high_risk">高风险</option>
              </select>
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <label className="text-sm font-medium text-slate-700">
              纬度
              <input name="latitude" type="number" step="0.000001" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              经度
              <input name="longitude" type="number" step="0.000001" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              距离(km)
              <input name="distance_km" type="number" min="0" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              适合年龄
              <input name="min_kid_age" type="number" min="0" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </label>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-slate-700">
            <label className="inline-flex items-center gap-2">
              <input name="has_parking" type="checkbox" />
              可停车
            </label>
            <label className="inline-flex items-center gap-2">
              <input name="has_toilet" type="checkbox" />
              有洗手间
            </label>
          </div>

          <label className="block text-sm font-medium text-slate-700">
            图片 URL
            <input name="image_url" type="url" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            推荐理由/安全提示 *
            <textarea name="description" required rows={4} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            中文说明
            <textarea name="description_zh" rows={3} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </label>

          <button type="submit" disabled={loading} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
            {loading ? "提交中..." : "提交审核"}
          </button>

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          {needsLogin ? (
            <Link href={`/login?next=${encodeURIComponent(pathname || "/submit-spot")}`} className="inline-flex text-sm text-emerald-700 hover:underline">
              去登录
            </Link>
          ) : null}
        </form>
      </section>
    </main>
  );
}
