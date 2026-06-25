import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        ok: true,
        status: "ready"
      },
      {
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      vercelCommit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ?? null,
      vercelBranch: process.env.VERCEL_GIT_COMMIT_REF ?? null,
      nextPublicSiteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? null,
      hasSiteUrl: Boolean(process.env.SITE_URL)
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
