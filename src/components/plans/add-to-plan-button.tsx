"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarPlus } from "lucide-react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Locale } from "@/lib/i18n/config";
import { getAddToPlanMessages } from "@/lib/i18n/messages";

type Props = {
  destinationId: string;
  locale: Locale;
};

function getNextSaturdayISO() {
  const now = new Date();
  const day = now.getDay();
  const diff = (6 - day + 7) % 7;
  now.setDate(now.getDate() + diff);
  return now.toISOString().slice(0, 10);
}

export function AddToPlanButton({ destinationId, locale }: Props) {
  const text = getAddToPlanMessages(locale);
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);

  async function handleAdd() {
    if (loading) return;
    setLoading(true);
    setError("");
    setMessage("");
    setNeedsLogin(false);

    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) {
        setNeedsLogin(true);
        setError(text.needSignIn);
        return;
      }

      const today = new Date().toISOString().slice(0, 10);
      const { data: existingPlan } = await supabase
        .from("weekend_plans")
        .select("id,plan_date")
        .eq("user_id", user.id)
        .gte("plan_date", today)
        .order("plan_date", { ascending: true })
        .limit(1)
        .maybeSingle();

      let planId = existingPlan?.id as string | undefined;
      if (!planId) {
        const nextDate = getNextSaturdayISO();
        const { data: newPlan, error: createError } = await supabase
          .from("weekend_plans")
          .insert({
            user_id: user.id,
            title: "我的周末计划",
            plan_date: nextDate,
            status: "draft"
          })
          .select("id")
          .single();
        if (createError || !newPlan) {
          throw createError ?? new Error("Create plan failed");
        }
        planId = newPlan.id as string;
      }

      const { data: existingItem, error: existingItemError } = await supabase
        .from("plan_items")
        .select("id")
        .eq("plan_id", planId)
        .eq("destination_id", destinationId)
        .maybeSingle();
      if (existingItemError) throw existingItemError;
      if (existingItem) {
        setMessage(locale === "zh" ? "这个地点已经在你的计划里。" : "This destination is already in your plan.");
        return;
      }

      const { data: itemRows } = await supabase
        .from("plan_items")
        .select("id,sort_order")
        .eq("plan_id", planId)
        .order("sort_order", { ascending: false })
        .limit(1);

      const nextSort = (itemRows?.[0]?.sort_order ?? -1) + 1;
      const { error: insertError } = await supabase.from("plan_items").insert(
        {
          plan_id: planId,
          destination_id: destinationId,
          sort_order: nextSort
        }
      );
      if (insertError) throw insertError;

      setMessage(text.added);
    } catch {
      setError(text.addFailed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleAdd}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
      >
        <CalendarPlus className="h-4 w-4" />
        {loading ? text.adding : text.addToPlan}
      </button>
      {message ? <p className="mt-1 text-xs text-emerald-700">{message}</p> : null}
      {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
      {needsLogin ? (
        <Link href={`/login?next=${encodeURIComponent(pathname || "/")}`} className="mt-1 inline-flex text-xs text-emerald-700 hover:underline">
          {text.signInFirst}
        </Link>
      ) : null}
    </div>
  );
}
