import { NextResponse } from "next/server";
import { getRequestAuth } from "@/lib/auth/request-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { supabase, user, authSource } = await getRequestAuth(request);

  if (!user) {
    return NextResponse.json({ ok: true, isAdmin: false, email: null, authSource });
  }

  const { data, error } = await supabase.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();

  return NextResponse.json({
    ok: true,
    isAdmin: !error && Boolean(data),
    email: user.email ?? null,
    authSource
  });
}
