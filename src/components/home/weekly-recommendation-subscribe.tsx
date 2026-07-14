"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Check, X } from "lucide-react";
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
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
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

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("qimeide:feedback-visibility", { detail: { hidden: open } }));
    return () => {
      window.dispatchEvent(new CustomEvent("qimeide:feedback-visibility", { detail: { hidden: false } }));
    };
  }, [open]);

  function toggleScenario(option: string) {
    setSelectedScenarios((values) =>
      values.includes(option) ? values.filter((value) => value !== option) : [...values, option]
    );
  }

  function closeDialog() {
    setOpen(false);
  }

  async function submitApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    setError("");

    const form = new FormData(event.currentTarget);
    const payload = {
      parentName: String(form.get("parentName") ?? ""),
      contact: String(form.get("contact") ?? ""),
      city: String(form.get("city") ?? ""),
      childrenAge: String(form.get("childrenAge") ?? ""),
      preferredScenarios: selectedScenarios,
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
          closeDialog();
          return;
        }
        throw new Error(result.message ?? "申请提交失败，请稍后再试。");
      }

      if (result.application) setMyApplications((values) => [result.application!, ...values]);
      setMessage("申请已收到！我们会尽快审核。如果通过，会使用你填写的联系方式与你联系。");
      setSelectedScenarios([]);
      event.currentTarget.reset();
      closeDialog();
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
            {message ? (
              <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-4 text-sm font-semibold leading-6 text-emerald-800">
                <p className="text-2xl leading-none">🎉</p>
                <p className="mt-2 text-base font-black">申请已收到！</p>
                <p className="mt-1 font-medium">我们会尽快审核。如果通过，会使用你填写的联系方式与你联系。</p>
              </div>
            ) : null}
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
        <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-slate-950/45 px-3 py-4 md:items-center md:px-4 md:py-6" role="dialog" aria-modal="true" aria-labelledby="family-application-title">
          <form onSubmit={submitApplication} className="max-h-[calc(100vh-24px)] w-full max-w-2xl overflow-y-auto rounded-[24px] bg-white shadow-2xl md:max-h-[calc(100vh-48px)]">
            <div className="px-5 pb-28 pt-5 md:px-6 md:pb-6 md:pt-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-black text-emerald-700">首批体验家庭</p>
                  <h3 id="family-application-title" className="mt-2 text-2xl font-black text-slate-950">
                    申请成为体验家庭
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={closeDialog}
                  className="interactive-button inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                  aria-label="关闭"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900">
                <p className="font-black">加入栖美地首批体验家庭。</p>
                <p className="mt-1">
                  成功入选后，我们会优先邀请你体验武汉及周边适合家庭出行的目的地，并邀请你分享真实体验，帮助更多家庭做出更好的周末决策。
                </p>
              </div>

              <section className="mt-5 rounded-2xl border border-slate-100 bg-white">
                <div className="border-b border-slate-100 px-4 py-3">
                  <h4 className="text-base font-black text-slate-950">基本信息（必填）</h4>
                  <p className="mt-1 text-xs text-slate-500">前三项填完即可提交申请。</p>
                </div>
                <div className="grid gap-4 p-4 md:grid-cols-2">
                  <label className="text-sm font-bold text-slate-800">
                    家长称呼 *
                    <input name="parentName" required minLength={2} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500" placeholder="例如：小林妈妈" />
                  </label>
                  <label className="text-sm font-bold text-slate-800">
                    联系方式 *
                    <span className="mt-1 block text-xs font-medium leading-5 text-slate-500">填写一种方便联系您的方式即可：手机号 / 微信 / 邮箱</span>
                    <input name="contact" required minLength={5} defaultValue={defaultContact} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500" placeholder="例如：138xxxx8888 或 微信：xxx" />
                  </label>
                  <label className="text-sm font-bold text-slate-800 md:col-span-2">
                    孩子年龄 *
                    <input name="childrenAge" required className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500" placeholder="例如：3岁、6岁、9岁" />
                  </label>
                </div>
              </section>

              <section className="mt-4 rounded-2xl border border-slate-100 bg-white">
                <div className="border-b border-slate-100 px-4 py-3">
                  <h4 className="text-base font-black text-slate-950">更多信息（选填）</h4>
                  <p className="mt-1 text-xs text-slate-500">补充越具体，我们越容易匹配合适的体验机会。</p>
                </div>
                <div className="grid gap-4 p-4 md:grid-cols-2">
                  <label className="text-sm font-bold text-slate-800">
                    所在城市
                    <span className="mt-1 block text-xs font-medium leading-5 text-slate-500">当前首批仅招募武汉家庭。</span>
                    <input name="city" minLength={2} defaultValue="武汉" className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500" />
                  </label>
                  <label className="text-sm font-bold text-slate-800">
                    可出行时间
                    <input name="availableTime" className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500" placeholder="例如：周六上午、周日下午" />
                  </label>
                  <label className="text-sm font-bold text-slate-800 md:col-span-2">
                    出行人数
                    <input name="familySize" type="number" min={1} max={20} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500" placeholder="例如：3" />
                  </label>
                </div>

                <fieldset className="px-4 pb-4">
                  <legend className="text-sm font-bold text-slate-800">感兴趣方向</legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {familyExperienceScenarioOptions.map((option) => {
                      const selected = selectedScenarios.includes(option);
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => toggleScenario(option)}
                          aria-pressed={selected}
                          className={`interactive-button inline-flex min-h-10 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-bold transition ${
                            selected
                              ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                              : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50"
                          }`}
                        >
                          {selected ? <Check className="h-4 w-4" /> : null}
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <label className="block px-4 pb-4 text-sm font-bold text-slate-800">
                  补充说明
                  <textarea
                    name="message"
                    rows={5}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm leading-6 outline-none focus:border-emerald-500"
                    placeholder={"例如：\n• 希望停车方便\n• 家里有婴儿车\n• 更喜欢野餐\n• 周末一般下午出门"}
                  />
                </label>
              </section>
            </div>

            <div className="sticky bottom-0 border-t border-slate-100 bg-white/95 px-5 py-3 pb-[calc(12px+env(safe-area-inset-bottom))] backdrop-blur md:static md:px-6 md:pb-6">
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={closeDialog} className="interactive-button h-12 rounded-full border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 hover:bg-slate-50 sm:w-36">
                  先不提交
                </button>
                <button type="submit" disabled={submitting} className="interactive-button h-12 rounded-full bg-emerald-600 px-6 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60 sm:min-w-52">
                  {submitting ? "提交中..." : "申请成为首批体验家庭"}
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
