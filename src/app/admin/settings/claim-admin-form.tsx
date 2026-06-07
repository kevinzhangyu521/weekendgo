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
        {pending ? "设置中..." : "将当前账号设为管理员"}
      </button>
      {state.message ? (
        <p className={`mt-4 rounded-lg px-3 py-2 text-sm ${state.ok ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
