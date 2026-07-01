"use client";

import { useActionState } from "react";
import { claimFirstAdmin } from "./actions";

type State = {
  ok: boolean;
  message: string;
};

export function ClaimAdminForm() {
  const [state, formAction, pending] = useActionState<State, FormData>(claimFirstAdmin, { ok: false, message: "" });

  return (
    <form action={formAction} className="mt-4">
      <button type="submit" disabled={pending} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
        {pending ? "\u8bbe\u7f6e\u4e2d..." : "\u8bbe\u7f6e\u4e3a\u7b2c\u4e00\u4e2a\u7ba1\u7406\u5458"}
      </button>
      {state.message ? (
        <p className={`mt-4 rounded-lg px-3 py-2 text-sm ${state.ok ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
