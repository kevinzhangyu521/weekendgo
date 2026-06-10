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
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));
  let response = NextResponse.redirect(`${origin}${next}`, { status: 303 });
  let setCookieCount = 0;

  if (code) {
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
          setCookieCount += cookiesToSet.length;
        }
      }
    });
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      response = NextResponse.redirect(`${origin}/login?authError=invalid_link`, { status: 303 });
      response.headers.set("Cache-Control", "no-store");
      return response;
    }
    if (data.session) await supabase.auth.getUser();
    response.headers.set("X-Qimeide-Callback-Has-Session", data.session ? "true" : "false");
  }

  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Qimeide-Callback-Has-Code", code ? "true" : "false");
  response.headers.set("X-Qimeide-Callback-Set-Cookie-Count", String(setCookieCount));
  return response;
}
