import { LoginForm } from "@/components/auth/login-form";
import { getLocale } from "@/lib/i18n/server";

export default async function LoginPage() {
  const locale = await getLocale();
  return <LoginForm locale={locale} />;
}
