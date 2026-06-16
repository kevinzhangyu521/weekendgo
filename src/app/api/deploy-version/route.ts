import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      localExpectedCommit: "pending-homepage-copy-and-auth-polish",
      vercelCommit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ?? null,
      vercelBranch: process.env.VERCEL_GIT_COMMIT_REF ?? null,
      nextPublicSiteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? null,
      hasSiteUrl: Boolean(process.env.SITE_URL),
      passwordLoginMarker: "supabase-ssr-cookie-bridge",
      loginPageMarker: "browser-local-session-auth-2026-06-16-v20"
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
