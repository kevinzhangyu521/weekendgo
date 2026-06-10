import type { User } from "@supabase/supabase-js";
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
    return { supabase, user: null };
  }
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
