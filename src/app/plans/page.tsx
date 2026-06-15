import { MyPlansClient } from "@/components/plans/my-plans-client";
import { getLocale } from "@/lib/i18n/server";

export default async function PlansPage() {
  const locale = await getLocale();
  return <MyPlansClient locale={locale} />;
}
