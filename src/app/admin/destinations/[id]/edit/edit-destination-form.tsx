"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { DestinationImage } from "@/components/destinations/destination-image";
import { DestinationPhotoManager } from "@/components/admin/destination-photo-manager";
import type { AdminDestination } from "@/features/admin/destinations";
import { toChineseRegionName } from "@/lib/geo/region-names";
import { createClient } from "@/lib/supabase/client";

const scenarios = [
  { value: "creek", label: "\u6eaf\u6eaa" },
  { value: "camping", label: "\u9732\u8425" },
  { value: "hiking", label: "\u5f92\u6b65" },
  { value: "picnic", label: "\u91ce\u9910" }
] as const;

const labelClass = "block text-sm font-bold text-slate-900";
const inputClass = "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm";

async function authHeaders() {
  const supabase = createClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();
  const headers: Record<string, string> = {};
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
  return headers;
}

export function EditDestinationForm({ item }: { item: AdminDestination }) {
  const router = useRouter();
  const [locationText, setLocationText] = useState(item.address || `${item.provinceZh || toChineseRegionName(item.province)} ${item.cityZh || toChineseRegionName(item.city)} ${item.nameZh || item.name}`.trim());
  const [latitude, setLatitude] = useState(String(item.latitude || ""));
  const [longitude, setLongitude] = useState(String(item.longitude || ""));
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [locationError, setLocationError] = useState("");
  const [state, setState] = useState({ ok: false, message: "" });

  async function locateByAddress() {
    const query = locationText.trim();
    setLocationMessage("");
    setLocationError("");

    if (!query) {
      setLocationError("\u8bf7\u5148\u586b\u5199\u5730\u70b9\u5730\u5740\u6216\u5bfc\u822a\u4f4d\u7f6e\u3002");
      return;
    }

    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!token) {
      setLocationError("\u7f3a\u5c11 Mapbox Token\uff0c\u6682\u65f6\u65e0\u6cd5\u81ea\u52a8\u5b9a\u4f4d\u3002");
      return;
    }

    setLocating(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${encodeURIComponent(token)}&limit=1&language=zh`
      );
      if (!response.ok) throw new Error("\u5b9a\u4f4d\u670d\u52a1\u8fd4\u56de\u5f02\u5e38\u3002");

      const data = (await response.json()) as { features?: Array<{ center?: [number, number]; place_name?: string }> };
      const first = data.features?.[0];
      const center = first?.center;
      if (!center) throw new Error("\u6ca1\u6709\u627e\u5230\u5339\u914d\u7684\u4f4d\u7f6e\uff0c\u8bf7\u628a\u5730\u5740\u5199\u5f97\u66f4\u5177\u4f53\u3002");

      const [lng, lat] = center;
      setLongitude(String(Math.round(lng * 1000000) / 1000000));
      setLatitude(String(Math.round(lat * 1000000) / 1000000));
      setLocationMessage(`\u5df2\u5b9a\u4f4d\uff1a${first.place_name ?? query}`);
    } catch (error) {
      setLocationError(error instanceof Error ? error.message : "\u81ea\u52a8\u5b9a\u4f4d\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002");
    } finally {
      setLocating(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setSaving(true);
    setState({ ok: false, message: "" });

    try {
      const response = await fetch(`/api/admin/destinations/${item.id}`, {
        method: "PUT",
        headers: await authHeaders(),
        credentials: "include",
        cache: "no-store",
        body: formData
      });
      const result = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !result.ok) throw new Error(result.message ?? "\u4fdd\u5b58\u5931\u8d25\u3002");
      setState({ ok: true, message: result.message ?? "\u4fdd\u5b58\u6210\u529f\u3002" });
      window.setTimeout(() => {
        router.push("/admin/destinations");
        router.refresh();
      }, 1200);
    } catch (err) {
      setState({ ok: false, message: err instanceof Error ? err.message : "\u4fdd\u5b58\u5931\u8d25\u3002" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} encType="multipart/form-data" className="mt-5 space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <input type="hidden" name="id" value={item.id} />

      {state.message ? (
        <div className={`rounded-lg px-3 py-2 text-sm font-medium ${state.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>
          {state.message}
        </div>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">{"\u57fa\u672c\u4fe1\u606f"}</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <label className={labelClass}>
            {"\u540d\u79f0 *"}
            <input name="name" required defaultValue={item.nameZh || item.name} className={inputClass} />
          </label>
          <label className={labelClass}>
            {"\u7701\u4efd *"}
            <input name="province" required defaultValue={item.provinceZh || toChineseRegionName(item.province)} placeholder={"\u4f8b\u5982\uff1a\u6e56\u5317"} className={inputClass} />
          </label>
          <label className={labelClass}>
            {"\u57ce\u5e02 *"}
            <input name="city" required defaultValue={item.cityZh || toChineseRegionName(item.city)} className={inputClass} />
          </label>
        </div>
        <label className={labelClass}>
          {"\u5730\u70b9\u5730\u5740/\u5bfc\u822a\u4f4d\u7f6e"}
          <input
            name="address"
            value={locationText}
            onChange={(event) => setLocationText(event.target.value)}
            placeholder={"\u4f8b\u5982\uff1a\u6b66\u6c49 \u4e1c\u6e56\u7eff\u9053 \u68a8\u56ed\u5e7f\u573a"}
            className={inputClass}
          />
          <span className="mt-1 block text-xs font-normal text-slate-500">{"\u7528\u4e8e\u81ea\u52a8\u5b9a\u4f4d\uff0c\u4e0d\u9700\u8981\u76f4\u63a5\u586b\u5199\u7eac\u5ea6\u548c\u7ecf\u5ea6\u3002"}</span>
        </label>
        <label className={labelClass}>
          {"开放时间"}
          <input name="opening_hours" defaultValue={item.openingHours ?? ""} placeholder="例如：09:00-18:00 / 全天开放 / 以现场为准" className={inputClass} />
        </label>
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
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-slate-900">{"\u5730\u56fe\u5b9a\u4f4d"}</p>
              <p className="mt-1 text-xs text-slate-500">
                {latitude && longitude ? `\u5df2\u5b9a\u4f4d\uff1a${latitude}, ${longitude}` : "\u6682\u672a\u5b9a\u4f4d\uff0c\u8bf7\u6839\u636e\u5730\u5740\u81ea\u52a8\u5b9a\u4f4d\u3002"}
              </p>
            </div>
            <button
              type="button"
              onClick={locateByAddress}
              disabled={locating}
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {locating ? "\u5b9a\u4f4d\u4e2d..." : "\u6839\u636e\u5730\u5740\u81ea\u52a8\u5b9a\u4f4d"}
            </button>
          </div>
          {locationMessage ? <p className="mt-2 text-xs font-medium text-emerald-700">{locationMessage}</p> : null}
          {locationError ? <p className="mt-2 text-xs font-medium text-red-600">{locationError}</p> : null}
          <input name="latitude" type="hidden" value={latitude} readOnly />
          <input name="longitude" type="hidden" value={longitude} readOnly />
          <details className="mt-3">
            <summary className="cursor-pointer text-xs font-semibold text-slate-600">{"\u9ad8\u7ea7\uff1a\u624b\u52a8\u4fee\u6b63\u5750\u6807"}</summary>
            <div className="mt-2 grid gap-3 md:grid-cols-2">
              <label className={labelClass}>
                {"\u7eac\u5ea6"}
                <input type="number" step="0.000001" value={latitude} onChange={(event) => setLatitude(event.target.value)} className={inputClass} />
              </label>
              <label className={labelClass}>
                {"\u7ecf\u5ea6"}
                <input type="number" step="0.000001" value={longitude} onChange={(event) => setLongitude(event.target.value)} className={inputClass} />
              </label>
            </div>
          </details>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className={labelClass}>
            {"\u8bc4\u5206"}
            <input name="rating" type="number" min="0" max="5" step="0.1" defaultValue={item.rating} className={inputClass} />
          </label>
          <label className={labelClass}>
            {"\u9002\u5408\u5e74\u9f84"}
            <input name="min_kid_age" type="number" min="0" defaultValue={item.minKidAge} className={inputClass} />
          </label>
          <label className={labelClass}>
            {"\u95e8\u7968\u4fe1\u606f"}
            <input name="ticket_price" defaultValue={item.ticketPrice ?? ""} placeholder={"\u4f8b\u5982\uff1a\u514d\u8d39 / 30\u5143 / \u4ee5\u666f\u533a\u4e3a\u51c6"} className={inputClass} />
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
        <h2 className="text-base font-bold text-slate-900">{"决策信息"}</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <label className={labelClass}>
            {"适合年龄下限"}
            <input name="suitable_age_min" type="number" min="0" defaultValue={item.suitableAgeMin ?? ""} placeholder="例如：3" className={inputClass} />
          </label>
          <label className={labelClass}>
            {"适合年龄上限"}
            <input name="suitable_age_max" type="number" min="0" defaultValue={item.suitableAgeMax ?? ""} placeholder="例如：12" className={inputClass} />
          </label>
          <label className={labelClass}>
            {"建议游玩时长"}
            <input name="suggested_duration" defaultValue={item.suggestedDuration ?? ""} placeholder="例如：2-4小时 / 半天 / 1天" className={inputClass} />
          </label>
          <label className={labelClass}>
            {"一家三口预算"}
            <input name="family_budget" defaultValue={item.familyBudget ?? ""} placeholder="例如：约100-200元 / 免费 / 以现场为准" className={inputClass} />
          </label>
          <label className={labelClass}>
            {"最佳游玩时间"}
            <input name="best_time" defaultValue={item.bestTime ?? ""} placeholder="例如：春秋季 / 上午 / 傍晚" className={inputClass} />
          </label>
          <label className="flex items-end gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
            <input name="reservation_required" type="checkbox" defaultChecked={Boolean(item.reservationRequired)} />
            {"是否需要预约"}
          </label>
        </div>
      </section>

      <section className="space-y-3 border-t border-slate-100 pt-5">
        <h2 className="text-base font-bold text-slate-900">{"配套设施"}</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <label className={labelClass}>
            {"停车详情"}
            <textarea name="parking_detail" rows={3} defaultValue={item.parkingDetail ?? ""} placeholder="例如：有停车场，周末建议早到；停车费以现场为准。" className={inputClass} />
          </label>
          <label className={labelClass}>
            {"卫生间详情"}
            <textarea name="toilet_detail" rows={3} defaultValue={item.toiletDetail ?? ""} placeholder="例如：入口附近有公共卫生间，部分区域距离较远。" className={inputClass} />
          </label>
        </div>
        <div className="flex flex-wrap gap-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
          <label className="inline-flex items-center gap-2 font-semibold">
            <input name="stroller_friendly" type="checkbox" defaultChecked={Boolean(item.strollerFriendly)} />
            {"婴儿车友好"}
          </label>
          <label className="inline-flex items-center gap-2 font-semibold">
            <input name="pet_friendly" type="checkbox" defaultChecked={Boolean(item.petFriendly)} />
            {"宠物友好"}
          </label>
        </div>
      </section>

      <section className="space-y-3 border-t border-slate-100 pt-5">
        <h2 className="text-base font-bold text-slate-900">{"推荐与提醒"}</h2>
        <label className={labelClass}>
          {"编辑推荐理由"}
          <textarea name="editor_recommendation" rows={3} defaultValue={item.editorRecommendation ?? ""} placeholder="例如：第一次带孩子来不会累，路线成熟，适合周末半日出发。" className={inputClass} />
        </label>
        <div className="grid gap-3 md:grid-cols-2">
          <label className={labelClass}>
            {"带娃提醒"}
            <textarea name="family_tips" rows={3} defaultValue={item.familyTips ?? ""} placeholder="例如：建议带防晒、防蚊、水杯和替换衣物。" className={inputClass} />
          </label>
          <label className={labelClass}>
            {"避坑提醒"}
            <textarea name="avoid_pitfalls" rows={3} defaultValue={item.avoidPitfalls ?? ""} placeholder="例如：周末停车紧张，雨后涉水区域需要谨慎。" className={inputClass} />
          </label>
        </div>
      </section>

      <section className="space-y-3 border-t border-slate-100 pt-5">
        <h2 className="text-base font-bold text-slate-900">{"\u56fe\u7247\u4e0e\u63cf\u8ff0"}</h2>
        {item.image ? (
          <div className="h-40 overflow-hidden rounded-lg bg-slate-100">
            <DestinationImage src={item.image} alt={item.nameZh || item.name} loading="lazy" decoding="async" className="h-full w-full object-cover" />
          </div>
        ) : null}
        <label className={labelClass}>
          {"\u66f4\u6362\u56fe\u7247"}
          <input name="image_file" type="file" accept="image/*" className={inputClass} />
          <span className="mt-1 block text-xs font-normal text-slate-500">{"\u4e0d\u9009\u65b0\u56fe\u7247\u65f6\uff0c\u4fdd\u7559\u539f\u56fe\u7247\u3002"}</span>
        </label>
        <label className={labelClass}>
          {"\u63cf\u8ff0 *"}
          <textarea name="description" required rows={4} defaultValue={item.descriptionZh || item.description} className={inputClass} />
        </label>
        <DestinationPhotoManager
          destinationId={item.id}
          destinationName={item.nameZh || item.name}
          initialPhotos={item.photos ?? []}
          hasLegacyCover={Boolean(item.image?.trim())}
        />
      </section>

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
        <button
          disabled={saving}
          className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "\u4fdd\u5b58\u4e2d..." : "\u4fdd\u5b58\u4fee\u6539"}
        </button>
        <Link href="/admin/destinations" className="text-sm text-slate-600 hover:underline">
          {"\u53d6\u6d88"}
        </Link>
      </div>
    </form>
  );
}
