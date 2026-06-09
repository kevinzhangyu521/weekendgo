import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { QIMEIDE_ACCESS_COOKIE } from "@/lib/auth/server-session-cookies";

export async function createClient() {
  const cookieStore = await cookies();
  const hasSupabaseAuthCookie = cookieStore.getAll().some((cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("-auth-token"));
  const fallbackAccessToken = hasSupabaseAuthCookie ? null : cookieStore.get(QIMEIDE_ACCESS_COOKIE)?.value;

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: fallbackAccessToken
      ? {
          headers: {
            Authorization: `Bearer ${fallbackAccessToken}`
          }
        }
      : undefined,
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // Server Components cannot write cookies. Middleware refreshes Supabase auth cookies instead.
      }
    }
  });

  return supabase;
}
