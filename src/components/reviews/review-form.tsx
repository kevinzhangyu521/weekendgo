"use client";

import { useActionState, useEffect, useState } from "react";
import type { DestinationReview } from "@/features/reviews/types";
import { saveDestinationReview, type ReviewFormState } from "@/app/destinations/[id]/review-actions";
import { hasLocalAuthState } from "@/lib/auth/client-auth-state";

type Props = {
  destinationId: string;
  initialReview: DestinationReview | null;
  isSignedIn: boolean;
};

export function ReviewForm({ destinationId, initialReview, isSignedIn }: Props) {
  const [state, formAction] = useActionState<ReviewFormState, FormData>(saveDestinationReview, { ok: false, message: "" });
  const [rating, setRating] = useState(initialReview?.rating ?? 5);
  const [locallySignedIn, setLocallySignedIn] = useState(isSignedIn);

  useEffect(() => {
    if (hasLocalAuthState()) setLocallySignedIn(true);
    if (state.ok && !initialReview) {
      setRating(5);
    }
  }, [initialReview, state.ok]);

  if (!locallySignedIn) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        {"\u767b\u5f55\u540e\u53ef\u4ee5\u7559\u4e0b\u771f\u5b9e\u4f53\u9a8c\uff0c\u5e2e\u52a9\u5176\u4ed6\u4eb2\u5b50\u5bb6\u5ead\u5224\u65ad\u662f\u5426\u9002\u5408\u524d\u5f80\u3002"}
      </div>
    );
  }

  return (
    <form action={formAction} className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
      <input type="hidden" name="destination_id" value={destinationId} />
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-emerald-950">{"\u6211\u7684\u4f53\u9a8c\u8bc4\u5206"}</span>
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value)}
            className={`rounded-full px-3 py-1 text-sm font-semibold ${rating >= value ? "bg-amber-400 text-white" : "bg-white text-slate-500"}`}
          >
            {"\u2605"}
          </button>
        ))}
        <input type="hidden" name="rating" value={rating} />
      </div>

      <label className="mt-3 block text-sm font-semibold text-emerald-950" htmlFor="review-content">
        {"\u771f\u5b9e\u4f53\u9a8c"}
      </label>
      <textarea
        id="review-content"
        name="content"
        rows={4}
        defaultValue={initialReview?.content ?? ""}
        minLength={4}
        maxLength={500}
        required
        placeholder="\u4f8b\u5982\uff1a\u505c\u8f66\u662f\u5426\u65b9\u4fbf\u3001\u5b69\u5b50\u73a9\u5f97\u600e\u4e48\u6837\u3001\u6709\u6ca1\u6709\u9700\u8981\u907f\u5751\u7684\u5730\u65b9\u3002"
        className="mt-2 w-full rounded-xl border border-emerald-100 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-400"
      />

      <label className="mt-3 block text-sm font-semibold text-emerald-950" htmlFor="visit-date">
        {"\u6e38\u73a9\u65e5\u671f\uff08\u53ef\u9009\uff09"}
      </label>
      <input
        id="visit-date"
        name="visit_date"
        type="date"
        defaultValue={initialReview?.visitDate ?? ""}
        className="mt-2 rounded-xl border border-emerald-100 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-400"
      />

      {state.message ? <p className={`mt-3 text-sm font-medium ${state.ok ? "text-emerald-700" : "text-rose-600"}`}>{state.message}</p> : null}

      <button className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
        {initialReview ? "\u66f4\u65b0\u4f53\u9a8c" : "\u63d0\u4ea4\u4f53\u9a8c"}
      </button>
    </form>
  );
}
