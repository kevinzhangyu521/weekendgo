import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { QIMEIDE_ACCESS_TOKEN_COOKIE } from "@/lib/auth/server-session-cookies";
import { createAuthenticatedPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";

export type CurrentAuth = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: User | null;
};

export async function getCurrentAuth(): Promise<CurrentAuth> {
  const supabase = await createClient();

  try {
    const {
      data: { user }
    } = await supabase.auth.getUser();

    return { supabase, user };
  } catch {
    // Fall through to the small first-party session cookie below.
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(QIMEIDE_ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) return { supabase, user: null };

  const authenticatedSupabase = createAuthenticatedPublicClient(accessToken) as unknown as CurrentAuth["supabase"];
  const {
    data: { user },
    error
  } = await authenticatedSupabase.auth.getUser(accessToken);

  return { supabase: authenticatedSupabase, user: error ? null : user };
}

export async function getCurrentUser() {
  const { user } = await getCurrentAuth();
  return user;
}

export async function getCurrentAuthWithAdmin() {
  const { supabase, user } = await getCurrentAuth();
  if (!user) return { supabase, user: null, isAdmin: false };

  const { data } = await supabase.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
  return { supabase, user, isAdmin: Boolean(data) };
}
