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
        <p className="text-sm font-semibold text-emerald-700">栖美地账号</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">{user ? "已登录" : "当前未登录"}</h1>
        <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm leading-7 text-slate-700">
          {user ? (
            <p>
              当前账号：<span className="font-medium text-slate-900">{user.email}</span>
            </p>
          ) : (
            <p>当前浏览器没有读取到有效登录状态。你可以重新登录后继续收藏、加入计划或管理内容。</p>
          )}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/" className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
            返回首页
          </Link>
          {!user ? (
            <Link href="/login?next=/auth-status" className="rounded-full border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700">
              去登录
            </Link>
          ) : null}
        </div>
      </section>
    </main>
  );
}
