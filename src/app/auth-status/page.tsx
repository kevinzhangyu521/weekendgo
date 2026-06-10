import Link from "next/link";
import { cookies } from "next/headers";
import { QIMEIDE_ACCESS_COOKIE, QIMEIDE_EMAIL_COOKIE, QIMEIDE_LOGIN_DEBUG_COOKIE, QIMEIDE_REFRESH_COOKIE, getQimeideCookieDomain } from "@/lib/auth/server-session-cookies";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AuthStatusPage() {
  const cookieStore = await cookies();
  const hasSupabaseAuthCookie = cookieStore.getAll().some((cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("-auth-token"));
  const qimeideEmail = cookieStore.get(QIMEIDE_EMAIL_COOKIE)?.value ?? null;
  const hasQimeideAccessToken = Boolean(cookieStore.get(QIMEIDE_ACCESS_COOKIE)?.value);
  const hasQimeideRefreshToken = Boolean(cookieStore.get(QIMEIDE_REFRESH_COOKIE)?.value);
  const cookieTest = cookieStore.get("qimeide_cookie_test")?.value ?? null;
  const loginDebug = cookieStore.get(QIMEIDE_LOGIN_DEBUG_COOKIE)?.value ?? null;

  const supabase = await createClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-800">
      <section className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">{user ? "\u5df2\u767b\u5f55" : "\u672a\u767b\u5f55"}</h1>
        <p className="mt-3 text-sm text-slate-600">
          {user ? `\u670d\u52a1\u7aef\u5df2\u8bfb\u53d6\u5230\u8d26\u53f7\uff1a${user.email ?? "\u672a\u8bfb\u53d6\u5230\u90ae\u7bb1"}` : "\u670d\u52a1\u7aef\u6682\u65f6\u6ca1\u6709\u8bfb\u53d6\u5230\u6709\u6548\u767b\u5f55\u72b6\u6001\u3002"}
        </p>

        <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm leading-7 text-slate-700">
          <p>{`Cookie \u57df\u540d\u7b56\u7565\uff1a${getQimeideCookieDomain() || "\u5f53\u524d\u57df\u540d"}`}</p>
          <p>{`Supabase \u767b\u5f55 Cookie\uff1a${hasSupabaseAuthCookie ? "\u5df2\u6536\u5230" : "\u672a\u6536\u5230"}`}</p>
          <p>{`\u7ad9\u5185\u8d26\u53f7 Cookie\uff1a${qimeideEmail || "\u672a\u6536\u5230"}`}</p>
          <p>{`\u7ad9\u5185 Access Token\uff1a${hasQimeideAccessToken ? "\u5df2\u6536\u5230" : "\u672a\u6536\u5230"}`}</p>
          <p>{`\u7ad9\u5185 Refresh Token\uff1a${hasQimeideRefreshToken ? "\u5df2\u6536\u5230" : "\u672a\u6536\u5230"}`}</p>
          <p>{`\u6d4b\u8bd5 Cookie\uff1a${cookieTest ? "\u5df2\u6536\u5230" : "\u672a\u6536\u5230"}`}</p>
          <p>{`\u6700\u8fd1\u767b\u5f55\u8bca\u65ad\uff1a${loginDebug || "\u672a\u6536\u5230"}`}</p>
          <p>{`\u670d\u52a1\u7aef\u7528\u6237\uff1a${user?.email ?? "\u672a\u8bfb\u53d6\u5230"}`}</p>
          {error ? <p className="text-rose-600">{`\u9519\u8bef\uff1a${error.message}`}</p> : null}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/" className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
            {"\u8fd4\u56de\u9996\u9875"}
          </Link>
          <Link href="/login" className="rounded-full border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700">
            {"\u53bb\u767b\u5f55"}
          </Link>
        </div>
      </section>
    </main>
  );
}
