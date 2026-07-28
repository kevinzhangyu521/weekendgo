"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import {
  familyDestinationExperienceAgeLabels,
  type FamilyDestinationExperience,
  type FamilyDestinationExperienceChildAgeGroup
} from "@/features/family-destination-experiences/types";
import { createClient } from "@/lib/supabase/client";

type Props = {
  destinationId: string;
  experiences: FamilyDestinationExperience[];
  isSignedIn: boolean;
  loginHref: string;
};

type SubmitResponse = {
  ok?: boolean;
  message?: string;
};

const ageOptions: FamilyDestinationExperienceChildAgeGroup[] = ["0-3", "3-6", "6-12", "12+"];

async function authHeaders() {
  const supabase = createClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
  return headers;
}

function formatDate(value: string | null) {
  if (!value) return "未填写日期";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(value));
}

export function FamilyExperienceSection({ destinationId, experiences, isSignedIn, loginHref }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submitExperience(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    setError("");

    const form = new FormData(event.currentTarget);
    const payload = {
      destinationId,
      childAgeGroup: String(form.get("childAgeGroup") ?? ""),
      visitedAt: String(form.get("visitedAt") ?? "") || null,
      recommendation: String(form.get("recommendation") ?? ""),
      tip: String(form.get("tip") ?? "")
    };

    try {
      const response = await fetch("/api/family-destination-experiences", {
        method: "POST",
        headers: await authHeaders(),
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify(payload)
      });
      const result = (await response.json()) as SubmitResponse;
      if (!response.ok || !result.ok) throw new Error(result.message ?? "提交失败，请稍后再试。");
      setMessage(result.message ?? "已提交，审核通过后会展示。");
      event.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "提交失败，请稍后再试。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="family-experiences" className="mt-5 scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-950">真实家庭体验</h2>
          <p className="mt-1 text-sm text-slate-600">只展示审核通过的精选体验，帮助家庭更快判断是否适合前往。</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">最多展示 3 条</span>
      </div>

      <div className="mt-4 grid gap-3">
        {experiences.length === 0 ? (
          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">暂无审核通过的家庭体验。</div>
        ) : (
          experiences.slice(0, 3).map((item) => (
            <article key={item.id} className="rounded-2xl bg-slate-50 p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                <span className="rounded-full bg-white px-2.5 py-1 text-slate-700 ring-1 ring-slate-200">
                  孩子年龄：{familyDestinationExperienceAgeLabels[item.childAgeGroup]}
                </span>
                <span>出行日期：{formatDate(item.visitedAt)}</span>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-xs font-bold text-emerald-700">推荐</p>
                  <p className="mt-1 text-sm leading-6 text-slate-800">{item.recommendation}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-700">提醒</p>
                  <p className="mt-1 text-sm leading-6 text-slate-800">{item.tip}</p>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
        <h3 className="text-base font-black text-emerald-950">提交你的真实体验</h3>
        <p className="mt-1 text-sm leading-6 text-emerald-900">提交后先进入审核，不会直接公开。</p>
        {!isSignedIn ? (
          <Link href={loginHref} className="interactive-button mt-3 inline-flex h-11 items-center rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-700">
            登录后提交体验
          </Link>
        ) : (
          <form onSubmit={submitExperience} className="mt-4 grid gap-3">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm font-bold text-emerald-950">
                孩子年龄段
                <select name="childAgeGroup" required className="mt-2 h-11 w-full rounded-xl border border-emerald-100 bg-white px-3 text-sm outline-none focus:border-emerald-500">
                  <option value="">请选择</option>
                  {ageOptions.map((option) => (
                    <option key={option} value={option}>{familyDestinationExperienceAgeLabels[option]}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-bold text-emerald-950">
                出行日期
                <input name="visitedAt" type="date" className="mt-2 h-11 w-full rounded-xl border border-emerald-100 bg-white px-3 text-sm outline-none focus:border-emerald-500" />
              </label>
            </div>
            <label className="text-sm font-bold text-emerald-950">
              推荐
              <textarea name="recommendation" required minLength={4} maxLength={300} rows={3} className="mt-2 w-full rounded-xl border border-emerald-100 bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-emerald-500" placeholder="这里最适合什么家庭？为什么值得去？" />
            </label>
            <label className="text-sm font-bold text-emerald-950">
              提醒
              <textarea name="tip" required minLength={4} maxLength={300} rows={3} className="mt-2 w-full rounded-xl border border-emerald-100 bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-emerald-500" placeholder="停车、路线、天气、安全、低龄孩子需要注意什么？" />
            </label>
            {message ? <p className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-emerald-700">{message}</p> : null}
            {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</p> : null}
            <div>
              <button type="submit" disabled={submitting} className="interactive-button h-11 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60">
                {submitting ? "提交中..." : "提交体验"}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
