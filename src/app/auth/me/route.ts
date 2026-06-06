import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

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

  const { data } = await supabase.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();

  return NextResponse.json(
    {
      user: {
        id: user.id,
        email: user.email ?? null
      },
      isAdmin: Boolean(data)
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
