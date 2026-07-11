"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import {
  familyExperienceScenarioOptions,
  familyExperienceStatusLabels,
  type FamilyExperienceApplication
} from "@/features/family-experience/types";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { createClient } from "@/lib/supabase/client";

type Props = {
  locale: "en" | "zh";
};

type ApplicationResponse = {
  ok?: boolean;
  message?: string;
  duplicate?: boolean;
  application?: FamilyExperienceApplication;
  items?: FamilyExperienceApplication[];
};

function pick(locale: Props["locale"], en: string, zh: string) {
  return locale === "zh" ? zh : en;
}

async function authHeaders() {
  const supabase = createClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
  return headers;
}

function getDeviceType() {
  if (typeof window === "undefined") return "unknown";
  return window.matchMedia("(max-width: 767px)").matches ? "mobile" : "desktop";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function WeeklyRecommendationSubscribe({ locale }: Props) {
  const currentUser = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [loadingMine, setLoadingMine] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [myApplications, setMyApplications] = useState<FamilyExperienceApplication[]>([]);
  const latestApplication = myApplications[0];

  const defaultContact = useMemo(() => currentUser.email ?? "", [currentUser.email]);

  async function loadMine() {
    if (currentUser.isLoading || !currentUser.hasUser) {
      setMyApplications([]);
      return;
    }

    setLoadingMine(true);
    try {
      const response = await fetch("/api/family-experience-applications/mine", {
        headers: await authHeaders(),
        credentials: "include",
        cache: "no-store"
      });
      const result = (await response.json()) as ApplicationResponse;
      if (response.ok && result.ok) setMyApplications(result.items ?? []);
    } finally {
      setLoadingMine(false);
    }
  }

  useEffect(() => {
    void loadMine();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.hasUser, currentUser.isLoading]);

  async function submitApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    setError("");

    const form = new FormData(event.currentTarget);
    const preferredScenarios = form.getAll("preferredScenarios").map(String);
    const payload = {
      parentName: String(form.get("parentName") ?? ""),
      contact: String(form.get("contact") ?? ""),
      city: String(form.get("city") ?? ""),
      childrenAge: String(form.get("childrenAge") ?? ""),
      preferredScenarios,
      availableTime: String(form.get("availableTime") ?? ""),
      familySize: String(form.get("familySize") ?? ""),
      message: String(form.get("message") ?? ""),
      sourcePageUrl: typeof window === "undefined" ? "" : window.location.href,
      deviceType: getDeviceType(),
      userAgent: typeof navigator === "undefined" ? "" : navigator.userAgent
    };

    try {
      const response = await fetch("/api/family-experience-applications", {
        method: "POST",
        headers: await authHeaders(),
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify(payload)
      });
      const result = (await response.json()) as ApplicationResponse;
      if (!response.ok || !result.ok) {
        if (result.duplicate && result.application) {
          setMyApplications((values) => [result.application!, ...values.filter((item) => item.id !== result.application!.id)]);
          setMessage(result.message ?? "你已经提交过申请，我们会按最新进度处理。");
          setOpen(false);
          return;
        }
        throw new Error(result.message ?? "申请提交失败，请稍后再试。");
      }

      if (result.application) setMyApplications((values) => [result.application!, ...values]);
      setMessage(result.message ?? "申请已提交，我们会尽快联系你。");
      event.currentTarget.reset();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "申请提交失败，请稍后再试。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="weekly-recommendation-subscribe" className="qmd-container mt-14 scroll-mt-24 md:mt-20">
      <div className="rounded-[24px] border border-emerald-100 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.06)] md:p-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black text-emerald-700">{pick(locale, "Founding Family Experience", "首批体验家庭")}</p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.02em] text-slate-950 md:text-3xl">
              {pick(locale, "Join Qimeide's founding family experience group", "加入栖美地首批体验家庭")}
            </h2>
            <p className="mt-2 max-w-2xl text-base font-semibold leading-7 text-slate-600">
              {pick(locale, "Experience real Wuhan family destinations every week and share your feedback with us.", "每周体验真实的武汉亲子目的地，并把你的使用感受告诉我们。")}
            </p>
            {latestApplication ? (
              <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                <p className="font-bold">
                  你的申请进度：{familyExperienceStatusLabels[latestApplication.status]} · {latestApplication.applicationNo}
                </p>
                <p className="mt-1">更新时间：{formatDate(latestApplication.updatedAt)}</p>
                {latestApplication.adminReply ? <p className="mt-1">管理员回复：{latestApplication.adminReply}</p> : null}
              </div>
            ) : loadingMine ? (
              <p className="mt-4 text-sm text-slate-500">正在读取你的申请状态...</p>
            ) : null}
            {message ? <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{message}</p> : null}
            {error ? <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p> : null}
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="interactive-button h-12 shrink-0 rounded-full bg-emerald-600 px-7 text-base font-bold text-white shadow-sm hover:bg-emerald-700"
          >
            {pick(locale, "Apply now", "申请成为体验家庭")}
          </button>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/45 px-4 py-6" role="dialog" aria-modal="true" aria-labelledby="family-application-title">
          <form onSubmit={submitApplication} className="w-full max-w-2xl rounded-[24px] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black text-emerald-700">首批体验家庭</p>
                <h3 id="family-application-title" className="mt-2 text-2xl font-black text-slate-950">
                  申请成为体验家庭
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">提交后我们会在后台处理申请，适合时会联系你参与体验。</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="interactive-button inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                aria-label="关闭"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="text-sm font-bold text-slate-800">
                家长称呼
                <input name="parentName" required minLength={2} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500" placeholder="例如：小林妈妈" />
              </label>
              <label className="text-sm font-bold text-slate-800">
                联系方式
                <input name="contact" required minLength={5} defaultValue={defaultContact} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500" placeholder="手机号 / 微信号 / 邮箱" />
              </label>
              <label className="text-sm font-bold text-slate-800">
                所在城市
                <input name="city" required minLength={2} defaultValue="武汉" className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500" />
              </label>
              <label className="text-sm font-bold text-slate-800">
                孩子年龄
                <input name="childrenAge" className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500" placeholder="例如：3岁、6岁+9岁" />
              </label>
              <label className="text-sm font-bold text-slate-800">
                可出行时间
                <input name="availableTime" className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500" placeholder="例如：周六上午、周日下午" />
              </label>
              <label className="text-sm font-bold text-slate-800">
                出行人数
                <input name="familySize" type="number" min={1} max={20} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500" placeholder="例如：3" />
              </label>
            </div>

            <fieldset className="mt-4">
              <legend className="text-sm font-bold text-slate-800">感兴趣的出行方向</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {familyExperienceScenarioOptions.map((option) => (
                  <label key={option} className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
                    <input name="preferredScenarios" type="checkbox" value={option} className="h-4 w-4 accent-emerald-600" />
                    {option}
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="mt-4 block text-sm font-bold text-slate-800">
              补充说明
              <textarea name="message" rows={3} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm leading-6 outline-none focus:border-emerald-500" placeholder="例如：更想找不累、停车方便、适合低龄孩子的地方。" />
            </label>

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setOpen(false)} className="interactive-button h-11 rounded-full border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 hover:bg-slate-50">
                先不提交
              </button>
              <button type="submit" disabled={submitting} className="interactive-button h-11 rounded-full bg-emerald-600 px-6 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60">
                {submitting ? "提交中..." : "提交申请"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
