import type { User } from "@supabase/supabase-js";
import { getCurrentAuth } from "@/lib/auth/current-user";
import { createAuthenticatedPublicClient } from "@/lib/supabase/public";

type SupabaseClient = Awaited<ReturnType<typeof getCurrentAuth>>["supabase"];

export type RequestAuth = {
  supabase: SupabaseClient;
  user: User | null;
  authSource: "supabase-cookie" | "authorization-bearer" | "none";
};

function getBearerToken(request: Request) {
  const header = request.headers.get("authorization");
  const match = header?.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

export async function getRequestAuth(request: Request): Promise<RequestAuth> {
  const cookieAuth = await getCurrentAuth();
  if (cookieAuth.user) {
    return {
      supabase: cookieAuth.supabase,
      user: cookieAuth.user,
      authSource: "supabase-cookie"
    };
  }

  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return {
      supabase: cookieAuth.supabase,
      user: null,
      authSource: "none"
    };
  }

  const supabase = createAuthenticatedPublicClient(accessToken) as unknown as SupabaseClient;
  const {
    data: { user },
    error
  } = await supabase.auth.getUser(accessToken);

  return {
    supabase,
    user: error ? null : user,
    authSource: error ? "none" : "authorization-bearer"
  };
}
