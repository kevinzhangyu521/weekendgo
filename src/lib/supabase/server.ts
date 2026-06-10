import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { QIMEIDE_ACCESS_COOKIE, QIMEIDE_SESSION_ID_COOKIE } from "@/lib/auth/server-session-cookies";
import { createPublicClient } from "@/lib/supabase/public";

type StoredAuthSession = {
  access_token: string | null;
};

async function getStoredAccessToken(sessionId: string | undefined) {
  if (!sessionId) return null;

  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("get_auth_session", {
    p_session_id: sessionId
  });

  if (error || !data || data.length === 0) return null;
  const row = data[0] as StoredAuthSession;
  return row.access_token ?? null;
}

export async function createClient() {
  const cookieStore = await cookies();
  const qimeideAccessToken =
    cookieStore.get(QIMEIDE_ACCESS_COOKIE)?.value ?? (await getStoredAccessToken(cookieStore.get(QIMEIDE_SESSION_ID_COOKIE)?.value));

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
