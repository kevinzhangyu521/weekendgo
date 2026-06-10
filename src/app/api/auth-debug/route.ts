import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function hasValue(value: string | undefined) {
  return Boolean(value && value.length > 0);
}

export async function GET() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const host = headerStore.get("host") ?? "unknown";
  const protocol = headerStore.get("x-forwarded-proto") ?? "https";
  const cookiesReceived = cookieStore.getAll().map((cookie) => cookie.name).sort();
  const hasSupabaseAuthCookie = cookiesReceived.some((name) => name.startsWith("sb-") && name.includes("auth-token"));
  const supabase = await createClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  return NextResponse.json(
    {
      ok: true,
      host,
      protocol,
      redirectUrl: `${protocol}://${host}/auth/callback`,
      env: {
        NEXT_PUBLIC_SUPABASE_URL: hasValue(process.env.NEXT_PUBLIC_SUPABASE_URL),
        NEXT_PUBLIC_SUPABASE_ANON_KEY: hasValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        NEXT_PUBLIC_SITE_URL: hasValue(process.env.NEXT_PUBLIC_SITE_URL),
        SITE_URL: hasValue(process.env.SITE_URL)
      },
      cookies: {
        hasSupabaseAuthCookie,
        cookiesReceived
      },
      getUser: {
        ok: Boolean(user),
        email: user?.email ?? null,
        error: error?.message ?? null
      }
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
