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

const sectionTitleClass = "text-base font-bold text-slate-900";
const sectionHintClass = "mt-1 text-xs text-slate-500";
const labelClass = "block text-sm font-bold text-slate-900";
const inputClass = "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm";

function safeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "");
}

export default function SubmitSpotPage() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function uploadImage(userId: string, file: File | null) {
    if (!file || file.size === 0) return null;
    if (!file.type.startsWith("image/")) throw new Error("\u8bf7\u4e0a\u4f20\u56fe\u7247\u6587\u4ef6\u3002");

    const path = `${userId}/${Date.now()}-${safeFileName(file.name) || "spot-photo.jpg"}`;
    const { error: uploadError } = await supabase.storage.from("spot-submission-photos").upload(path, file, {
      cacheControl: "3600",
      upsert: false
    });
    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("spot-submission-photos").getPublicUrl(path);
    return data.publicUrl;
  }

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

    const name = String(form.get("name") ?? "").trim();
    const city = String(form.get("city") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();
    const descriptionZh = String(form.get("description_zh") ?? "").trim();
    const imageEntry = form.get("image_file");
    const imageFile = imageEntry instanceof File ? imageEntry : null;

    if (!name || !city || !description) {
      setError("\u8bf7\u81f3\u5c11\u586b\u5199\u5730\u70b9\u540d\u79f0\u3001\u57ce\u5e02\u548c\u63a8\u8350\u7406\u7531\u3002");
      setLoading(false);
      return;
    }

    if (!imageFile || imageFile.size === 0) {
      setError("\u8bf7\u4e0a\u4f20\u4e00\u5f20\u5730\u70b9\u56fe\u7247\u3002");
      setLoading(false);
      return;
    }

    try {
      const imageUrl = await uploadImage(user.id, imageFile);

      const payload = {
        user_id: user.id,
        name,
        name_zh: name,
        city,
        city_zh: city,
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
        image_url: imageUrl,
        description,
        description_zh: descriptionZh || description
      };

      const { error: insertError } = await supabase.from("spot_submissions").insert(payload);
      if (insertError) throw insertError;

      formElement.reset();
      setSubmitted(true);
      setMessage("\u63d0\u4ea4\u6210\u529f\uff0c\u7ba1\u7406\u5458\u5ba1\u6838\u901a\u8fc7\u540e\u4f1a\u51fa\u73b0\u5728\u76ee\u7684\u5730\u5217\u8868\u3002");
      window.setTimeout(() => router.push("/"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "\u63d0\u4ea4\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-3xl px-4 py-6 md:px-6">
        <p className="text-sm text-slate-500">WeekendGo {"\u5171\u5efa"}</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">{"\u63a8\u8350\u4e00\u4e2a\u4eb2\u5b50\u6237\u5916\u5730\u70b9"}</h1>
        <p className="mt-2 text-sm text-slate-600">{"\u63d0\u4ea4\u540e\u4f1a\u8fdb\u5165\u5ba1\u6838\uff0c\u5ba1\u6838\u901a\u8fc7\u624d\u4f1a\u5c55\u793a\u7ed9\u5176\u4ed6\u5bb6\u5ead\u3002"}</p>

        {submitted ? (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5" />
              <div>
                <p className="font-semibold">{"\u63d0\u4ea4\u6210\u529f"}</p>
                <p className="mt-1 text-sm">{message}</p>
                <p className="mt-1 text-xs">{"\u9875\u9762\u5c06\u81ea\u52a8\u8fd4\u56de\u9996\u9875\u3002"}</p>
                <Link href="/" className="mt-3 inline-flex rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white">
                  {"\u8fd4\u56de\u9996\u9875"}
                </Link>
              </div>
            </div>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-5 space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <section className="space-y-3">
            <div>
              <h2 className={sectionTitleClass}>{"\u57fa\u672c\u4fe1\u606f"}</h2>
              <p className={sectionHintClass}>{"\u5148\u8bf4\u6e05\u8fd9\u662f\u54ea\u91cc\uff0c\u65b9\u4fbf\u7ba1\u7406\u5458\u6838\u5bf9\u5730\u70b9\u3002"}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className={labelClass}>
                {"\u5730\u70b9\u540d\u79f0 *"}
                <input name="name" required placeholder={"\u4f8b\u5982\uff1a\u6e05\u6eaa\u8c37\u4eb2\u5b50\u6eaf\u6eaa"} className={inputClass} />
              </label>
              <label className={labelClass}>
                {"\u57ce\u5e02 *"}
                <input name="city" required placeholder={"\u4f8b\u5982\uff1a\u676d\u5dde"} className={inputClass} />
              </label>
            </div>
            <label className={labelClass}>
              {"\u5730\u5740/\u5b9a\u4f4d\u8bf4\u660e"}
              <input name="address" placeholder={"\u53ef\u586b\u5199\u505c\u8f66\u70b9\u3001\u5165\u53e3\u6216\u9644\u8fd1\u5730\u6807"} className={inputClass} />
            </label>
          </section>

          <section className="space-y-3 border-t border-slate-100 pt-5">
            <div>
              <h2 className={sectionTitleClass}>{"\u51fa\u884c\u4fe1\u606f"}</h2>
              <p className={sectionHintClass}>{"\u5e2e\u5176\u4ed6\u5bb6\u5ead\u5feb\u901f\u5224\u65ad\u662f\u5426\u9002\u5408\u5e26\u5b69\u5b50\u53bb\u3002"}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <label className={labelClass}>
                {"\u573a\u666f"}
                <select name="scenario" className={inputClass}>
                  {scenarios.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className={labelClass}>
                {"\u96be\u5ea6"}
                <select name="difficulty" className={inputClass}>
                  <option value="easy">{"\u4f4e\u96be\u5ea6"}</option>
                  <option value="moderate">{"\u4e2d\u96be\u5ea6"}</option>
                  <option value="hard">{"\u9ad8\u96be\u5ea6"}</option>
                </select>
              </label>
              <label className={labelClass}>
                {"\u98ce\u9669"}
                <select name="safety" className={inputClass}>
                  <option value="low_risk">{"\u4f4e\u98ce\u9669"}</option>
                  <option value="medium_risk">{"\u4e2d\u98ce\u9669"}</option>
                  <option value="high_risk">{"\u9ad8\u98ce\u9669"}</option>
                </select>
              </label>
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              <label className={labelClass}>
                {"\u7eac\u5ea6"}
                <input name="latitude" type="number" step="0.000001" placeholder={"\u53ef\u9009"} className={inputClass} />
              </label>
              <label className={labelClass}>
                {"\u7ecf\u5ea6"}
                <input name="longitude" type="number" step="0.000001" placeholder={"\u53ef\u9009"} className={inputClass} />
              </label>
              <label className={labelClass}>
                {"\u8ddd\u79bb(km)"}
                <input name="distance_km" type="number" min="0" placeholder={"\u4f8b\u5982\uff1a12"} className={inputClass} />
              </label>
              <label className={labelClass}>
                {"\u9002\u5408\u5e74\u9f84"}
                <input name="min_kid_age" type="number" min="0" placeholder={"\u4f8b\u5982\uff1a3"} className={inputClass} />
              </label>
            </div>
            <div className="flex flex-wrap gap-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              <label className="inline-flex items-center gap-2 font-semibold">
                <input name="has_parking" type="checkbox" />
                {"\u53ef\u505c\u8f66"}
              </label>
              <label className="inline-flex items-center gap-2 font-semibold">
                <input name="has_toilet" type="checkbox" />
                {"\u6709\u6d17\u624b\u95f4"}
              </label>
            </div>
          </section>

          <section className="space-y-3 border-t border-slate-100 pt-5">
            <div>
              <h2 className={sectionTitleClass}>{"\u7167\u7247\u4e0e\u8bf4\u660e"}</h2>
              <p className={sectionHintClass}>{"\u7167\u7247\u5fc5\u586b\uff0c\u5efa\u8bae\u4e0a\u4f20\u80fd\u770b\u6e05\u73af\u5883\u548c\u8def\u9762\u7684\u56fe\u7247\u3002"}</p>
            </div>
            <label className={labelClass}>
              {"\u4e0a\u4f20\u56fe\u7247 *"}
              <input name="image_file" type="file" accept="image/*" required className={inputClass} />
            </label>
            <label className={labelClass}>
              {"\u63a8\u8350\u7406\u7531/\u5b89\u5168\u63d0\u793a *"}
              <textarea name="description" required rows={4} placeholder={"\u8bf7\u5199\u660e\u4e3a\u4ec0\u4e48\u9002\u5408\u4eb2\u5b50\u5bb6\u5ead\uff0c\u4ee5\u53ca\u9700\u8981\u6ce8\u610f\u7684\u5b89\u5168\u4e8b\u9879\u3002"} className={inputClass} />
            </label>
            <label className={labelClass}>
              {"\u8865\u5145\u8bf4\u660e"}
              <textarea name="description_zh" rows={3} placeholder={"\u53ef\u8865\u5145\u5b63\u8282\u3001\u6c34\u6df1\u3001\u5395\u6240\u4f4d\u7f6e\u3001\u505c\u8f66\u5efa\u8bae\u7b49\u3002"} className={inputClass} />
            </label>
          </section>

          <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
            <button type="submit" disabled={loading} className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
              {loading ? "\u63d0\u4ea4\u4e2d..." : "\u63d0\u4ea4\u5ba1\u6838"}
            </button>
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
            {needsLogin ? (
              <Link href={`/login?next=${encodeURIComponent(pathname || "/submit-spot")}`} className="inline-flex text-sm text-emerald-700 hover:underline">
                {"\u53bb\u767b\u5f55"}
              </Link>
            ) : null}
          </div>
        </form>
      </section>
    </main>
  );
}
