import { NextResponse } from "next/server";
import { getCurrentAuthWithAdmin } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const { user, isAdmin } = await getCurrentAuthWithAdmin();

  if (!user) {
    return NextResponse.json(
      { user: null, isAdmin: false },
      {
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  }

  return NextResponse.json(
    {
      user: {
        id: user.id,
        email: user.email ?? null
      },
      isAdmin
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
