import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LoginPage() {
  const locale = await getLocale();
  const user = await getCurrentUser();

  return <LoginForm locale={locale} initialEmail={user?.email ?? null} />;
}
