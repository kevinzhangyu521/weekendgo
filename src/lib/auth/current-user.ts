import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { QIMEIDE_ACCESS_TOKEN_COOKIE } from "@/lib/auth/server-session-cookies";
import { createAuthenticatedPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import { getUserRole, isAdminRole, type UserRole } from "./roles";

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
  if (!user) return { supabase, user: null, role: "user" as UserRole, isAdmin: false };

  const role = await getUserRole(supabase, user.id);
  return { supabase, user, role, isAdmin: isAdminRole(role) };
}
