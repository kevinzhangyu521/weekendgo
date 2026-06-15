import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCurrentAuth } from "@/lib/auth/current-user";
import { QIMEIDE_ACCESS_TOKEN_COOKIE, QIMEIDE_REFRESH_TOKEN_COOKIE } from "@/lib/auth/server-session-cookies";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const cookieStore = await cookies();
  const { user } = await getCurrentAuth();
  const cookiesReceived = cookieStore.getAll().map((cookie) => cookie.name).sort();
  const hasSupabaseAuthCookie = cookiesReceived.some((name) => name.startsWith("sb-") && name.includes("auth-token"));
  const hasSiteSessionCookie = cookiesReceived.includes(QIMEIDE_ACCESS_TOKEN_COOKIE) && cookiesReceived.includes(QIMEIDE_REFRESH_TOKEN_COOKIE);

  return NextResponse.json(
    {
      hasUser: Boolean(user),
      email: user?.email ?? null,
      authMethod: "supabase-ssr-getUser",
      hasSupabaseAuthCookie,
      hasSiteSessionCookie,
      cookiesReceived
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
