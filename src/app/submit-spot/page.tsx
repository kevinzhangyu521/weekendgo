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

    if (!name || !city || !description) {
      setError("\u8bf7\u81f3\u5c11\u586b\u5199\u5730\u70b9\u540d\u79f0\u3001\u57ce\u5e02\u548c\u63a8\u8350\u7406\u7531\u3002");
      setLoading(false);
      return;
    }

    try {
      const imageFile = form.get("image_file") instanceof File ? form.get("image_file") : null;
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

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 rounded-xl border border-slate-200 bg-white p-5">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              {"\u5730\u70b9\u540d\u79f0 *"}
              <input name="name" required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              {"\u57ce\u5e02 *"}
              <input name="city" required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </label>
          </div>

          <label className="block text-sm font-medium text-slate-700">
            {"\u5730\u5740/\u5b9a\u4f4d\u8bf4\u660e"}
            <input name="address" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </label>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="text-sm font-medium text-slate-700">
              {"\u573a\u666f"}
              <select name="scenario" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                {scenarios.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              {"\u96be\u5ea6"}
              <select name="difficulty" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <option value="easy">{"\u4f4e\u96be\u5ea6"}</option>
                <option value="moderate">{"\u4e2d\u96be\u5ea6"}</option>
                <option value="hard">{"\u9ad8\u96be\u5ea6"}</option>
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              {"\u98ce\u9669"}
              <select name="safety" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <option value="low_risk">{"\u4f4e\u98ce\u9669"}</option>
                <option value="medium_risk">{"\u4e2d\u98ce\u9669"}</option>
                <option value="high_risk">{"\u9ad8\u98ce\u9669"}</option>
              </select>
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <label className="text-sm font-medium text-slate-700">
              {"\u7eac\u5ea6"}
              <input name="latitude" type="number" step="0.000001" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              {"\u7ecf\u5ea6"}
              <input name="longitude" type="number" step="0.000001" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              {"\u8ddd\u79bb(km)"}
              <input name="distance_km" type="number" min="0" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              {"\u9002\u5408\u5e74\u9f84"}
              <input name="min_kid_age" type="number" min="0" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </label>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-slate-700">
            <label className="inline-flex items-center gap-2">
              <input name="has_parking" type="checkbox" />
              {"\u53ef\u505c\u8f66"}
            </label>
            <label className="inline-flex items-center gap-2">
              <input name="has_toilet" type="checkbox" />
              {"\u6709\u6d17\u624b\u95f4"}
            </label>
          </div>

          <label className="block text-sm font-medium text-slate-700">
            {"\u4e0a\u4f20\u56fe\u7247"}
            <input name="image_file" type="file" accept="image/*" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            {"\u63a8\u8350\u7406\u7531/\u5b89\u5168\u63d0\u793a *"}
            <textarea name="description" required rows={4} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            {"\u8865\u5145\u8bf4\u660e"}
            <textarea name="description_zh" rows={3} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </label>

          <button type="submit" disabled={loading} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
            {loading ? "\u63d0\u4ea4\u4e2d..." : "\u63d0\u4ea4\u5ba1\u6838"}
          </button>

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          {needsLogin ? (
            <Link href={`/login?next=${encodeURIComponent(pathname || "/submit-spot")}`} className="inline-flex text-sm text-emerald-700 hover:underline">
              {"\u53bb\u767b\u5f55"}
            </Link>
          ) : null}
        </form>
      </section>
    </main>
  );
}
