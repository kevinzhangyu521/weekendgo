"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, CalendarDays, ImageDown, Link2, Pencil, QrCode, Save, Trash2 } from "lucide-react";
import { AmapNavigationButton } from "@/components/plans/amap-navigation-button";
import { createClient } from "@/lib/supabase/client";
import type { Locale } from "@/lib/i18n/config";
import { getPlanEditorMessages } from "@/lib/i18n/messages";
import { destinationName, destinationRegion } from "@/features/destinations/presenter";
import { displayPlanTitle } from "@/features/plans/title";
import type { PlanDetail } from "@/features/plans/types";

type Props = {
  plan: PlanDetail;
  locale: Locale;
};

function randomSlug() {
  return `wg-${Math.random().toString(36).slice(2, 10)}`;
}

function formatDistance(distanceKm: number) {
  if (!distanceKm || distanceKm <= 0) return "\u8ddd\u79bb\u5f85\u8ba1\u7b97";
  return `\u7ea6 ${distanceKm}km`;
}

export function PlanEditor({ plan, locale }: Props) {
  const text = getPlanEditorMessages(locale);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [title, setTitle] = useState(displayPlanTitle(plan.title));
  const [planDate, setPlanDate] = useState(plan.planDate);
  const [savingMeta, setSavingMeta] = useState(false);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [deletingPlan, setDeletingPlan] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [origin, setOrigin] = useState("");
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  async function saveMeta() {
    if (!title.trim() || !planDate) return;
    setSavingMeta(true);
    setError("");
    setOk("");

    const { error: updateError } = await supabase
      .from("weekend_plans")
      .update({ title: title.trim(), plan_date: planDate, updated_at: new Date().toISOString() })
      .eq("id", plan.id);

    setSavingMeta(false);
    if (updateError) {
      setError(text.saveFailed);
      return;
    }
    setOk(text.planUpdated);
    router.refresh();
  }

  async function removeItem(itemId: string) {
    setBusyItemId(itemId);
    setError("");
    setOk("");

    const { error: removeError } = await supabase.from("plan_items").delete().eq("id", itemId);
    setBusyItemId(null);
    if (removeError) {
      setError(text.removeFailed);
      return;
    }
    setOk(text.stopRemoved);
    router.refresh();
  }

  async function moveItem(index: number, direction: "up" | "down") {
    const current = plan.items[index];
    const target = direction === "up" ? plan.items[index - 1] : plan.items[index + 1];
    if (!current || !target) return;

    setBusyItemId(current.id);
    setError("");
    setOk("");

    const currentOrder = current.sortOrder;
    const targetOrder = target.sortOrder;

    const { error: err1 } = await supabase.from("plan_items").update({ sort_order: -999999 }).eq("id", current.id);
    if (err1) {
      setBusyItemId(null);
      setError(text.reorderFailed);
      return;
    }
    const { error: err2 } = await supabase.from("plan_items").update({ sort_order: currentOrder }).eq("id", target.id);
    if (err2) {
      setBusyItemId(null);
      setError(text.reorderFailed);
      return;
    }
    const { error: err3 } = await supabase.from("plan_items").update({ sort_order: targetOrder }).eq("id", current.id);
    setBusyItemId(null);
    if (err3) {
      setError(text.reorderFailed);
      return;
    }

    setOk(text.orderUpdated);
    router.refresh();
  }

  async function deletePlan() {
    if (!window.confirm(text.confirmDeletePlan)) return;
    setDeletingPlan(true);
    setError("");
    setOk("");

    const { error: deleteError } = await supabase.from("weekend_plans").delete().eq("id", plan.id);
    setDeletingPlan(false);
    if (deleteError) {
      setError(text.deleteFailed);
      return;
    }

    router.push("/plans");
    router.refresh();
  }

  async function toggleShare() {
    setSharing(true);
    setError("");
    setOk("");

    const nextPublic = !plan.isPublic;
    const payload: { is_public: boolean; share_slug?: string | null } = { is_public: nextPublic };
    if (nextPublic && !plan.shareSlug) payload.share_slug = randomSlug();

    const { error: updateError } = await supabase.from("weekend_plans").update(payload).eq("id", plan.id);
    setSharing(false);
    if (updateError) {
      setError(text.shareUpdateFailed);
      return;
    }
    setOk(nextPublic ? text.publicShareEnabled : text.publicShareDisabled);
    router.refresh();
  }

  async function copyShareLink() {
    if (!plan.shareSlug || !origin) return;
    await navigator.clipboard.writeText(`${origin}/plans/share/${plan.shareSlug}`);
    setOk(text.shareLinkCopied);
    setToast(text.clipboardCopied);
    window.setTimeout(() => setToast(""), 2200);
  }

  async function downloadQrPng() {
    if (!plan.shareSlug || !origin) return;
    const target = `${origin}/plans/share/${plan.shareSlug}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=440x440&data=${encodeURIComponent(target)}`;
    try {
      const res = await fetch(qrUrl);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${plan.shareSlug}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
      setToast(text.qrPngDownloaded);
      window.setTimeout(() => setToast(""), 2200);
    } catch {
      setError(text.qrDownloadFailed);
    }
  }

  function downloadShareCardPng() {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setError(text.posterGenerationFailed);
      return;
    }

    const g = ctx.createLinearGradient(0, 0, 1200, 630);
    g.addColorStop(0, "#0f172a");
    g.addColorStop(1, "#14532d");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1200, 630);

    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(70, 60, 1060, 510);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 34px sans-serif";
    ctx.fillText(locale === "zh" ? "\u6816\u7f8e\u5730\u5206\u4eab\u8ba1\u5212" : "Qimeide Shared Plan", 110, 130);

    ctx.font = "bold 52px sans-serif";
    const displayTitle = displayPlanTitle(plan.title);
    const title = displayTitle.length > 28 ? `${displayTitle.slice(0, 28)}...` : displayTitle;
    ctx.fillText(title, 110, 205);

    ctx.font = "26px sans-serif";
    ctx.fillStyle = "#d1fae5";
    ctx.fillText(locale === "zh" ? `\u65e5\u671f\uff1a${plan.planDate}   \u7ad9\u70b9\uff1a${plan.items.length}` : `Date: ${plan.planDate}   Stops: ${plan.items.length}`, 110, 250);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px sans-serif";
    ctx.fillText(locale === "zh" ? "\u8def\u7ebf\u9884\u89c8" : "Route Preview", 110, 310);

    ctx.font = "22px sans-serif";
    const previewStops = plan.items.slice(0, 5);
    previewStops.forEach((item, idx) => {
      const label = item.destination ? destinationName(item.destination, locale) : text.unknownDestination;
      const safe = label.length > 36 ? `${label.slice(0, 36)}...` : label;
      ctx.fillText(`${idx + 1}. ${safe}`, 120, 355 + idx * 45);
    });

    ctx.fillStyle = "#86efac";
    ctx.font = "20px sans-serif";
    ctx.fillText(locale === "zh" ? "\u5728\u8ba1\u5212\u9875\u751f\u6210 QR \u540e\u5373\u53ef\u5206\u4eab\u5b9e\u65f6\u94fe\u63a5" : "Open QR in plan editor to share the live link", 110, 550);

    const data = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = data;
    a.download = `${plan.shareSlug ?? plan.id}-card.png`;
    a.click();
    setToast(text.shareCardDownloaded);
    window.setTimeout(() => setToast(""), 2200);
  }

  const sharePath = plan.shareSlug ? `/plans/share/${plan.shareSlug}` : null;
  const fullShareUrl = sharePath && origin ? `${origin}${sharePath}` : "";
  const qrSrc = fullShareUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(fullShareUrl)}`
    : null;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="mb-2 text-sm font-medium text-slate-700">{text.planSettings}</p>
        <div className="grid gap-2 md:grid-cols-[1fr_220px_auto]">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
            <Pencil className="h-4 w-4 text-slate-500" />
            <input value={title} onChange={(event) => setTitle(event.target.value)} className="w-full bg-transparent text-sm text-slate-900 outline-none" />
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
            <CalendarDays className="h-4 w-4 text-slate-500" />
            <input type="date" value={planDate} onChange={(event) => setPlanDate(event.target.value)} className="w-full bg-transparent text-sm text-slate-900 outline-none" />
          </div>
          <button type="button" onClick={saveMeta} disabled={savingMeta} className="inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60">
            <Save className="h-4 w-4" />
            {savingMeta ? text.saving : text.save}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" onClick={toggleShare} disabled={sharing} className={`rounded-lg px-3 py-2 text-sm font-medium ${plan.isPublic ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-800"}`}>
            {sharing ? text.updating : plan.isPublic ? text.disablePublicShare : text.enablePublicShare}
          </button>

          {plan.isPublic && plan.shareSlug ? (
            <button type="button" onClick={copyShareLink} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
              <Link2 className="h-4 w-4" />
              {text.copyShareLink}
            </button>
          ) : null}

          {plan.isPublic && plan.shareSlug ? (
            <button type="button" onClick={() => setShowQr((v) => !v)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
              <QrCode className="h-4 w-4" />
              {showQr ? text.hideQr : text.showQr}
            </button>
          ) : null}

          <button type="button" onClick={deletePlan} disabled={deletingPlan} className="ml-auto inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm text-rose-700 disabled:opacity-60">
            <Trash2 className="h-4 w-4" />
            {deletingPlan ? text.deleting : text.deletePlan}
          </button>
        </div>

        {ok ? <p className="mt-2 text-xs text-emerald-700">{ok}</p> : null}
        {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}
        {toast ? <div className="mt-3 inline-flex rounded-md bg-slate-900 px-2.5 py-1 text-xs text-white no-print">{toast}</div> : null}

        {showQr && plan.isPublic && plan.shareSlug && qrSrc ? (
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 no-print">
            <p className="text-xs text-slate-600">{text.scanToOpen}</p>
            <img src={qrSrc} alt="Plan share QR code" className="mt-2 h-44 w-44 rounded-md border border-slate-200 bg-white" />
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" onClick={downloadQrPng} className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700">
                {text.downloadQrPng}
              </button>
              <button type="button" onClick={downloadShareCardPng} className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700">
                <ImageDown className="h-3.5 w-3.5" />
                {text.downloadShareCardPng}
              </button>
              <Link href={`${sharePath}?view=card`} target="_blank" className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700">
                {text.openPrintableCard}
              </Link>
            </div>
          </div>
        ) : null}
      </div>

      <div className="space-y-3">
        {plan.items.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">{text.noStopsYet}</div>
        ) : (
          plan.items.map((item, index) => (
            <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">{`${text.stop} ${index + 1}`}</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{item.destination ? destinationName(item.destination, locale) : text.unknownDestination}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.destination ? `${destinationRegion(item.destination, locale)} - ${formatDistance(item.destination.distanceKm)}` : text.noDetails}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                  {item.destination ? (
                    <AmapNavigationButton destination={item.destination} label={text.navigate} />
                  ) : null}
                  <button type="button" onClick={() => moveItem(index, "up")} disabled={index === 0 || busyItemId === item.id} className="rounded-md border border-slate-200 p-2 text-slate-700 disabled:opacity-40" title={text.moveUp}>
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => moveItem(index, "down")} disabled={index === plan.items.length - 1 || busyItemId === item.id} className="rounded-md border border-slate-200 p-2 text-slate-700 disabled:opacity-40" title={text.moveDown}>
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => removeItem(item.id)} disabled={busyItemId === item.id} className="rounded-md border border-rose-200 p-2 text-rose-700 disabled:opacity-40" title={text.remove}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
