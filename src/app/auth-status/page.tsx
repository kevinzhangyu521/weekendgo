import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AuthStatusPage() {
  const cookieStore = await cookies();
  const cookiesReceived = cookieStore.getAll().map((cookie) => cookie.name).sort();
  const hasSupabaseAuthCookie = cookiesReceived.some((name) => name.startsWith("sb-") && name.includes("auth-token"));
  const supabase = await createClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-800">
      <section className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">{user ? "已登录" : "未登录"}</h1>
        <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm leading-7 text-slate-700">
          <p>{`Supabase Auth Cookie：${hasSupabaseAuthCookie ? "已收到" : "未收到"}`}</p>
          <p>{`服务端用户：${user?.email ?? "未读取到"}`}</p>
          {error ? <p className="text-rose-600">{`错误：${error.message}`}</p> : null}
          <p className="break-all">{`Cookies：${cookiesReceived.join(", ") || "无"}`}</p>
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
