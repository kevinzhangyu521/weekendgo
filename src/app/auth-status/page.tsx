import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AuthStatusPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-800">
      <section className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-500">登录状态检测</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">{user ? "已登录" : "未登录"}</h1>
        <p className="mt-3 text-sm text-slate-600">
          {user ? `当前账号：${user.email ?? "未读取到邮箱"}` : "当前浏览器没有读取到 Supabase 登录状态。"}
        </p>
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
