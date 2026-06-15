import { FavoritesClient } from "@/components/favorites/favorites-client";
import { getLocale } from "@/lib/i18n/server";

export default async function FavoritesPage() {
  const locale = await getLocale();
  return <FavoritesClient locale={locale} />;
}
