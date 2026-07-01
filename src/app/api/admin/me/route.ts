import { NextResponse } from "next/server";
import { getRequestAuth } from "@/lib/auth/request-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { user, authSource, role, isAdmin } = await getRequestAuth(request);

  if (!user) {
    return NextResponse.json({ ok: true, isAdmin: false, role: "user", email: null, authSource });
  }

  return NextResponse.json({
    ok: true,
    isAdmin,
    role,
    email: user.email ?? null,
    authSource
  });
}
