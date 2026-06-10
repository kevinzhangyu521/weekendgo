import { cookies } from "next/headers";

export async function hasSupabaseAuthCookie() {
  const cookieStore = await cookies();
  return cookieStore.getAll().some((cookie) => cookie.name.startsWith("sb-"));
}
