import { NextResponse } from "next/server";

type DisplaySessionPayload = {
  email?: string;
};

function isSafeEmail(value: unknown): value is string {
  return typeof value === "string" && value.includes("@") && value.length <= 254;
}

export async function POST(request: Request) {
  let payload: DisplaySessionPayload = {};

  try {
    payload = (await request.json()) as DisplaySessionPayload;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!isSafeEmail(payload.email)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("qimeide_auth_email", payload.email, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });

  return response;
}
