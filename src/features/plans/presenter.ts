import type { Locale } from "@/lib/i18n/config";
import type { PlanDetail, PlanSummary } from "./types";

type PlanStatus = PlanSummary["status"] | PlanDetail["status"];

const planStatusLabelMap: Record<PlanStatus, { en: string; zh: string }> = {
  draft: { en: "Draft", zh: "\u8349\u7a3f" },
  published: { en: "Published", zh: "\u5df2\u53d1\u5e03" },
  archived: { en: "Archived", zh: "\u5df2\u5f52\u6863" }
};

export function planStatusLabel(status: PlanStatus, locale: Locale) {
  return locale === "zh" ? planStatusLabelMap[status].zh : planStatusLabelMap[status].en;
}
