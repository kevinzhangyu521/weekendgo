import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { QIMEIDE_ACCESS_COOKIE } from "@/lib/auth/server-session-cookies";

export async function createClient() {
  const cookieStore = await cookies();
  const qimeideAccessToken = cookieStore.get(QIMEIDE_ACCESS_COOKIE)?.value;

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: qimeideAccessToken
      ? {
          headers: {
            Authorization: `Bearer ${qimeideAccessToken}`
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

  if (qimeideAccessToken) {
    const getUser = supabase.auth.getUser.bind(supabase.auth);
    supabase.auth.getUser = ((jwt?: string) => getUser(jwt ?? qimeideAccessToken)) as typeof supabase.auth.getUser;
  }

  return supabase;
}
