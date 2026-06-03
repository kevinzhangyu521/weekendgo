import { LoginForm } from "@/components/auth/login-form";
import { getLocale } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const locale = await getLocale();
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return <LoginForm locale={locale} initialEmail={user?.email ?? null} />;
}
