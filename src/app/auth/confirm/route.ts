import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

export const runtime = "nodejs";

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(searchParams.get("next"));
  const response = NextResponse.redirect(type === "signup" ? `${origin}/login?confirmed=1` : `${origin}${next}`, { status: 303 });

  if (!tokenHash || !type) {
    return NextResponse.redirect(`${origin}/login?authError=missing_link`, { status: 303 });
  }

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookieOptions: {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type
  });

  if (error) {
    return NextResponse.redirect(`${origin}/login?authError=invalid_link`, { status: 303 });
  }

  if (data.session) await supabase.auth.getUser();

  response.headers.set("Cache-Control", "no-store");
  return response;
}
