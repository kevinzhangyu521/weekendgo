"use client";

import { useActionState } from "react";
import type { UserProfile } from "@/features/profiles/types";
import { updateProfile } from "./actions";

const scenarios = [
  { value: "camping", label: "\u9732\u8425" },
  { value: "creek", label: "\u6eaf\u6eaa" },
  { value: "hiking", label: "\u5f92\u6b65" },
  { value: "picnic", label: "\u91ce\u9910" }
] as const;

type State = {
  ok: boolean;
  message: string;
};

async function submitProfile(_state: State, formData: FormData) {
  return updateProfile(formData);
}

export function ProfileForm({ profile }: { profile: UserProfile }) {
  const [state, formAction, pending] = useActionState(submitProfile, { ok: false, message: "" });

  return (
    <form action={formAction} className="mt-5 space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <label className="block text-sm font-bold text-slate-900">
          {"\u767b\u5f55\u90ae\u7bb1"}
          <input value={profile.email} disabled className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500" />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-bold text-slate-900">
          {"\u6635\u79f0 *"}
          <input name="nickname" required defaultValue={profile.nickname} placeholder={"\u4f8b\u5982\uff1a\u5c0f\u660e\u7238\u7238"} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <span className="mt-1 block text-xs font-normal text-slate-500">{"\u4f60\u7684\u8bc4\u4ef7\u4f1a\u663e\u793a\u8fd9\u4e2a\u540d\u79f0\u3002"}</span>
        </label>
        <label className="block text-sm font-bold text-slate-900">
          {"\u5e38\u4f4f\u57ce\u5e02"}
          <input name="home_city" defaultValue={profile.homeCity} placeholder={"\u4f8b\u5982\uff1a\u676d\u5dde"} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        </label>
      </div>

      <label className="block text-sm font-bold text-slate-900">
        {"\u5b69\u5b50\u5e74\u9f84"}
        <input name="kid_age" type="number" min="0" max="18" defaultValue={profile.kidAge ?? ""} placeholder={"\u4f8b\u5982\uff1a5"} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
      </label>

      <div>
        <p className="text-sm font-bold text-slate-900">{"\u504f\u597d\u573a\u666f"}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {scenarios.map((item) => (
            <label key={item.value} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700">
              <input name="preferred_scenarios" type="checkbox" value={item.value} defaultChecked={profile.preferredScenarios.includes(item.value)} />
              {item.label}
            </label>
          ))}
        </div>
      </div>

      <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
        <input name="receive_notifications" type="checkbox" defaultChecked={profile.receiveNotifications} />
        {"\u63a5\u6536\u5ba1\u6838\u7ed3\u679c\u548c\u6d3b\u52a8\u901a\u77e5"}
      </label>

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
        <button disabled={pending} className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          {pending ? "\u4fdd\u5b58\u4e2d..." : "\u4fdd\u5b58\u8d44\u6599"}
        </button>
        {state.message ? <p className={`text-sm ${state.ok ? "text-emerald-700" : "text-rose-600"}`}>{state.message}</p> : null}
      </div>
    </form>
  );
}
