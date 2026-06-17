"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import type { DestinationReview } from "@/features/reviews/types";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { createClient } from "@/lib/supabase/client";

type Props = {
  destinationId: string;
  initialReview: DestinationReview | null;
  isSignedIn: boolean;
};

type SaveReviewResponse = {
  ok?: boolean;
  message?: string;
};

const fieldClass = "mt-1 w-full rounded-xl border border-emerald-100 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-400";

export function ReviewForm({ destinationId, initialReview, isSignedIn }: Props) {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const signedIn = isSignedIn || currentUser.isAuthenticated;
  const [rating, setRating] = useState(initialReview?.rating ?? 5);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [ok, setOk] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setMessage("");
    setOk(false);

    const supabase = createClient();
    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setSaving(false);
      setOk(false);
      setMessage("登录状态已失效，请重新登录后再提交体验。");
      return;
    }

    try {
      const response = await fetch("/api/reviews/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({
          destinationId,
          rating,
          content: String(form.get("content") ?? ""),
          suitableAge: String(form.get("suitable_age") ?? ""),
          parkingRating: String(form.get("parking_rating") ?? ""),
          toiletRating: String(form.get("toilet_rating") ?? ""),
          safetyNote: String(form.get("safety_note") ?? ""),
          recommend: form.get("recommend") === "yes" ? true : form.get("recommend") === "no" ? false : null,
          visitDate: String(form.get("visit_date") ?? "")
        })
      });
      const result = (await response.json()) as SaveReviewResponse;
      if (!response.ok || !result.ok) throw new Error(result.message ?? "提交失败，请稍后再试。");
      setOk(true);
      setMessage(result.message ?? "已提交，感谢你的真实体验。");
      router.refresh();
    } catch (error) {
      setOk(false);
      setMessage(error instanceof Error ? error.message : "提交失败，请稍后再试。");
    } finally {
      setSaving(false);
    }
  }

  if (currentUser.isLoading && !isSignedIn) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        {"正在读取登录状态..."}
      </div>
    );
  }

  if (!signedIn) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        {"登录后可以留下真实体验，帮助其他亲子家庭判断是否适合前往。"}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-emerald-950">{"我的体验评分"}</span>
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value)}
            className={`rounded-full px-3 py-1 text-sm font-semibold ${rating >= value ? "bg-amber-400 text-white" : "bg-white text-slate-500"}`}
          >
            {"★"}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="text-sm font-semibold text-emerald-950">
          {"适合年龄"}
          <select name="suitable_age" defaultValue={initialReview?.suitableAge ?? ""} className={fieldClass}>
            <option value="">{"请选择"}</option>
            <option value="0-3">{"0-3岁"}</option>
            <option value="3-6">{"3-6岁"}</option>
            <option value="6-12">{"6-12岁"}</option>
            <option value="12+">{"12岁+"}</option>
          </select>
        </label>
        <label className="text-sm font-semibold text-emerald-950">
          {"是否推荐再去"}
          <select name="recommend" defaultValue={initialReview?.recommend === true ? "yes" : initialReview?.recommend === false ? "no" : ""} className={fieldClass}>
            <option value="">{"请选择"}</option>
            <option value="yes">{"推荐"}</option>
            <option value="no">{"不太推荐"}</option>
          </select>
        </label>
        <label className="text-sm font-semibold text-emerald-950">
          {"停车情况"}
          <select name="parking_rating" defaultValue={initialReview?.parkingRating ?? ""} className={fieldClass}>
            <option value="">{"请选择"}</option>
            <option value="easy">{"停车方便"}</option>
            <option value="normal">{"停车一般"}</option>
            <option value="hard">{"停车较难"}</option>
          </select>
        </label>
        <label className="text-sm font-semibold text-emerald-950">
          {"厕所情况"}
          <select name="toilet_rating" defaultValue={initialReview?.toiletRating ?? ""} className={fieldClass}>
            <option value="">{"请选择"}</option>
            <option value="good">{"厕所方便"}</option>
            <option value="normal">{"厕所一般"}</option>
            <option value="poor">{"厕所较少"}</option>
          </select>
        </label>
      </div>

      <label className="mt-3 block text-sm font-semibold text-emerald-950" htmlFor="review-content">
        {"真实体验"}
      </label>
      <textarea
        id="review-content"
        name="content"
        rows={4}
        defaultValue={initialReview?.content ?? ""}
        minLength={4}
        maxLength={500}
        required
        placeholder="例如：停车方便吗？孩子玩得开心吗？厕所、遮阴、人流和安全情况怎么样？可以写给其他家长看的真实提醒。"
        className={fieldClass}
      />

      <label className="mt-3 block text-sm font-semibold text-emerald-950" htmlFor="safety-note">
        {"安全提醒（可选）"}
      </label>
      <input
        id="safety-note"
        name="safety_note"
        defaultValue={initialReview?.safetyNote ?? ""}
        maxLength={200}
        placeholder="例如：水边石头滑、周末人多、建议穿防滑鞋"
        className={fieldClass}
      />

      <label className="mt-3 block text-sm font-semibold text-emerald-950" htmlFor="visit-date">
        {"游玩日期（可选）"}
      </label>
      <input
        id="visit-date"
        name="visit_date"
        type="date"
        defaultValue={initialReview?.visitDate ?? ""}
        className="mt-2 rounded-xl border border-emerald-100 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-400"
      />

      {message ? <p className={`mt-3 text-sm font-medium ${ok ? "text-emerald-700" : "text-rose-600"}`}>{message}</p> : null}

      <button disabled={saving} className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
        {saving ? "提交中..." : initialReview ? "更新体验" : "提交体验"}
      </button>
    </form>
  );
}
