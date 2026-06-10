import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCurrentAuth } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const cookieStore = await cookies();
  const { user } = await getCurrentAuth();
  const cookiesReceived = cookieStore.getAll().map((cookie) => cookie.name).sort();

  return NextResponse.json(
    {
      hasUser: Boolean(user),
      email: user?.email ?? null,
      authMethod: "supabase-ssr-getUser",
      cookiesReceived
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
