import Link from "next/link";
import { cookies } from "next/headers";
import { QIMEIDE_ACCESS_COOKIE, QIMEIDE_EMAIL_COOKIE, QIMEIDE_REFRESH_COOKIE } from "@/lib/auth/server-session-cookies";
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

  const supabase = await createClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-800">
      <section className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">{user ? "已登录" : "未登录"}</h1>
        <p className="mt-3 text-sm text-slate-600">
          {user ? `服务端已读取到账号：${user.email ?? "未读取到邮箱"}` : "服务端暂时没有读取到有效登录状态。"}
        </p>

        <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm leading-7 text-slate-700">
          <p>{`Supabase 登录 Cookie：${hasSupabaseAuthCookie ? "已收到" : "未收到"}`}</p>
          <p>{`站内账号 Cookie：${qimeideEmail || "未收到"}`}</p>
          <p>{`站内 Access Token：${hasQimeideAccessToken ? "已收到" : "未收到"}`}</p>
          <p>{`站内 Refresh Token：${hasQimeideRefreshToken ? "已收到" : "未收到"}`}</p>
          <p>{`测试 Cookie：${cookieTest ? "已收到" : "未收到"}`}</p>
          <p>{`服务端用户：${user?.email ?? "未读取到"}`}</p>
          {error ? <p className="text-rose-600">{`错误：${error.message}`}</p> : null}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/" className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
            返回首页
          </Link>
          <Link href="/login" className="rounded-full border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700">
            去登录
          </Link>
        </div>
      </section>
    </main>
  );
}
