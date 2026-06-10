import { cookies } from "next/headers";
import { QIMEIDE_ACCESS_COOKIE } from "@/lib/auth/server-session-cookies";

export async function hasSupabaseAuthCookie() {
  const cookieStore = await cookies();
  return Boolean(cookieStore.get(QIMEIDE_ACCESS_COOKIE)?.value) || cookieStore.getAll().some((cookie) => cookie.name.startsWith("sb-"));
}
