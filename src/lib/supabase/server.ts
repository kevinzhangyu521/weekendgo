import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { QIMEIDE_ACCESS_COOKIE, QIMEIDE_REFRESH_COOKIE } from "@/lib/auth/server-session-cookies";

export async function createClient() {
  const cookieStore = await cookies();

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // Server Components cannot write cookies. Middleware refreshes Supabase auth cookies instead.
      }
    }
  });

  const accessToken = cookieStore.get(QIMEIDE_ACCESS_COOKIE)?.value;
  const refreshToken = cookieStore.get(QIMEIDE_REFRESH_COOKIE)?.value;

  if (accessToken && refreshToken) {
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    });
  }

  return supabase;
}
