import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type LoginPayload = {
  email?: string;
  password?: string;
  next?: string;
};

function safeNextPath(value: unknown) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/login")) return "/";
  return value;
}

function redirectToLogin(request: NextRequest, message: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("loginError", message);
  return NextResponse.redirect(url, { status: 303 });
}

async function readPayload(request: NextRequest): Promise<LoginPayload> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await request.json()) as LoginPayload;
  }

  const formData = await request.formData();
  return {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    next: String(formData.get("next") ?? "")
  };
}

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      message: "password-login route is reachable",
      authMethod: "supabase-ssr-password"
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}

export async function POST(request: NextRequest) {
  let payload: LoginPayload;

  try {
    payload = await readPayload(request);
  } catch {
    return redirectToLogin(request, "请填写邮箱和密码。");
  }

  const email = payload.email?.trim() ?? "";
  const password = payload.password ?? "";
  const next = safeNextPath(payload.next);

  if (!email || !email.includes("@") || password.length < 6) {
    return redirectToLogin(request, "请填写正确的邮箱和至少 6 位密码。");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  console.info("[auth/password-login]", {
    authMethod: "supabase-ssr-password",
    hasSession: Boolean(data.session),
    hasUser: Boolean(data.user),
    error: error?.message ?? null,
    redirectTo: new URL(next, request.url).toString(),
    host: request.nextUrl.host
  });

  if (error || !data.session || !data.user) {
    return redirectToLogin(request, "邮箱或密码不正确，请检查后再试。");
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return NextResponse.json(
      {
        ok: true,
        user: {
          id: data.user.id,
          email: data.user.email
        }
      },
      {
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  }

  const response = NextResponse.redirect(new URL(next, request.url), { status: 303 });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
