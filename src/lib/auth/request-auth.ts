import type { User } from "@supabase/supabase-js";
import { getCurrentAuth } from "@/lib/auth/current-user";
import { createAuthenticatedPublicClient } from "@/lib/supabase/public";
import { getUserRole, isAdminRole, type UserRole } from "./roles";

type SupabaseClient = Awaited<ReturnType<typeof getCurrentAuth>>["supabase"];

export type RequestAuth = {
  supabase: SupabaseClient;
  user: User | null;
  authSource: "supabase-cookie" | "authorization-bearer" | "none";
  role: UserRole;
  isAdmin: boolean;
};

function getBearerToken(request: Request) {
  const header = request.headers.get("authorization");
  const match = header?.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

export async function getRequestAuth(request: Request): Promise<RequestAuth> {
  const cookieAuth = await getCurrentAuth();
  if (cookieAuth.user) {
    const role = await getUserRole(cookieAuth.supabase, cookieAuth.user.id);
    return {
      supabase: cookieAuth.supabase,
      user: cookieAuth.user,
      authSource: "supabase-cookie",
      role,
      isAdmin: isAdminRole(role)
    };
  }

  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return {
      supabase: cookieAuth.supabase,
      user: null,
      authSource: "none",
      role: "user",
      isAdmin: false
    };
  }

  const supabase = createAuthenticatedPublicClient(accessToken) as unknown as SupabaseClient;
  const {
    data: { user },
    error
  } = await supabase.auth.getUser(accessToken);

  const role = user && !error ? await getUserRole(supabase, user.id) : "user";
  return {
    supabase,
    user: error ? null : user,
    authSource: error ? "none" : "authorization-bearer",
    role,
    isAdmin: !error && isAdminRole(role)
  };
}
