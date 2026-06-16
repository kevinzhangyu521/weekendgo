import { PlanDetailClient } from "@/components/plans/plan-detail-client";
import { getLocale } from "@/lib/i18n/server";

export default async function PlanDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const [locale, { id }] = await Promise.all([getLocale(), params]);
  return <PlanDetailClient id={id} locale={locale} />;
}
