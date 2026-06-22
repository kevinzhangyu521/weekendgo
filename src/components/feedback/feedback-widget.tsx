"use client";

import { FormEvent, useEffect, useState } from "react";
import { AlertCircle, Lightbulb, Loader2, MessageSquare, X } from "lucide-react";
import type { FeedbackType } from "@/features/feedback/types";
import { feedbackTypeLabels } from "@/features/feedback/types";

type FeedbackRequest = {
  type?: FeedbackType;
  contentPrefix?: string;
};

type FeedbackResponse = {
  ok?: boolean;
  message?: string;
};

const typeOptions: FeedbackType[] = ["bug", "place_error", "feature", "experience", "other"];

function detectDeviceType() {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent.toLowerCase();
  if (/ipad|tablet/.test(ua)) return "tablet";
  if (/mobile|iphone|android/.test(ua)) return "mobile";
  return "desktop";
}

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("experience");
  const [content, setContent] = useState("");
  const [contact, setContact] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    function handleOpen(event: Event) {
      const detail = (event as CustomEvent<FeedbackRequest>).detail;
      setType(detail?.type ?? "experience");
      setContent(detail?.contentPrefix ?? "");
      setMessage("");
      setError("");
      setOpen(true);
    }

    window.addEventListener("qimeide:open-feedback", handleOpen);
    return () => window.removeEventListener("qimeide:open-feedback", handleOpen);
  }, []);

  async function submitFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({
          type,
          content,
          contact,
          pageUrl: window.location.href,
          deviceType: detectDeviceType(),
          userAgent: navigator.userAgent
        })
      });
      const result = (await response.json()) as FeedbackResponse;
      if (!response.ok || !result.ok) throw new Error(result.message ?? "反馈提交失败，请稍后再试。");

      setMessage(result.message ?? "反馈已提交，感谢你的帮助。");
      setContent("");
      setContact("");
      setType("experience");
    } catch (err) {
      setError(err instanceof Error ? err.message : "反馈提交失败，请稍后再试。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="interactive-button fixed bottom-24 right-4 z-50 inline-flex h-12 items-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-semibold text-white shadow-xl shadow-slate-900/20 hover:bg-slate-800 md:bottom-6"
        aria-label="提交反馈"
      >
        <Lightbulb className="h-4 w-4 text-amber-300" />
        <span>反馈</span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[70] flex items-end bg-slate-950/40 p-3 backdrop-blur-sm md:items-center md:justify-center">
          <form onSubmit={submitFeedback} className="w-full rounded-2xl bg-white p-4 shadow-2xl md:max-w-lg md:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="inline-flex items-center gap-2 text-lg font-bold text-slate-900">
                  <MessageSquare className="h-5 w-5 text-emerald-600" />
                  提交反馈
                </p>
                <p className="mt-1 text-sm text-slate-500">告诉我们哪里不好用，或者地点信息哪里需要修正。</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="interactive-button rounded-full p-2 text-slate-500 hover:bg-slate-100" aria-label="关闭反馈表单">
                <X className="h-5 w-5" />
              </button>
            </div>

            <label className="mt-4 block text-sm font-bold text-slate-900">
              类型
              <select value={type} onChange={(event) => setType(event.target.value as FeedbackType)} className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500">
                {typeOptions.map((option) => (
                  <option key={option} value={option}>
                    {feedbackTypeLabels[option]}
                  </option>
                ))}
              </select>
            </label>

            <label className="mt-4 block text-sm font-bold text-slate-900">
              内容
              <textarea
                required
                minLength={5}
                rows={5}
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="请描述你遇到的问题，或希望我们改进的地方。"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm leading-6 outline-none focus:border-emerald-500"
              />
            </label>

            <label className="mt-4 block text-sm font-bold text-slate-900">
              联系方式（可选）
              <input
                value={contact}
                onChange={(event) => setContact(event.target.value)}
                placeholder="手机号 / 邮箱 / 微信，方便我们回访"
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500"
              />
            </label>

            <div className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-500">
              系统会自动记录当前页面、设备类型和提交时间，帮助我们更快定位问题。
            </div>

            {error ? (
              <div className="mt-3 flex gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}
            {message ? <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</div> : null}

            <div className="mt-4 flex gap-3">
              <button type="button" onClick={() => setOpen(false)} className="interactive-button h-11 flex-1 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                取消
              </button>
              <button disabled={submitting} className="interactive-button inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {submitting ? "提交中..." : "提交反馈"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
