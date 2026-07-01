import { NextResponse } from "next/server";
import { getCurrentAuthWithAdmin } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const { user, isAdmin, role } = await getCurrentAuthWithAdmin();

  if (!user) {
    return NextResponse.json(
      { user: null, role: "user", isAdmin: false },
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
      role,
      isAdmin
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
