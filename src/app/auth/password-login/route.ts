import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

type LoginPayload = {
  email?: string;
  password?: string;
};

function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && value.includes("@") && value.length <= 254;
}

function isValidPassword(value: unknown): value is string {
  return typeof value === "string" && value.length >= 6 && value.length <= 256;
}

export async function POST(request: NextRequest) {
  let payload: LoginPayload = {};

  try {
    payload = (await request.json()) as LoginPayload;
  } catch {
    return NextResponse.json({ ok: false, message: "\u8bf7\u586b\u5199\u90ae\u7bb1\u548c\u5bc6\u7801\u3002" }, { status: 400 });
  }

  const email = payload.email?.trim();
  const password = payload.password;

  if (!isValidEmail(email) || !isValidPassword(password)) {
    return NextResponse.json({ ok: false, message: "\u8bf7\u586b\u5199\u6b63\u786e\u7684\u90ae\u7bb1\u548c\u81f3\u5c11 6 \u4f4d\u5bc6\u7801\u3002" }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true, email });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return NextResponse.json({ ok: false, message: "\u90ae\u7bb1\u6216\u5bc6\u7801\u4e0d\u6b63\u786e\uff0c\u8bf7\u68c0\u67e5\u540e\u518d\u8bd5\u3002" }, { status: 401 });
  }

  response.cookies.set("qimeide_auth_email", data.user.email ?? email, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });

  return response;
}
