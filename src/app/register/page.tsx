import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto flex max-w-md flex-col px-4 py-10 md:px-0">
        <h1 className="text-2xl font-bold text-slate-900">注册</h1>
        <p className="mt-2 text-sm text-slate-600">注册后可收藏地点、加入计划、提交反馈和添加地点。</p>

        <RegisterForm />

        <div className="mt-4 flex items-center gap-3 text-sm">
          <Link href="/login" className="text-emerald-700 hover:underline">
            去登录
          </Link>
          <Link href="/" className="text-slate-600 hover:underline">
            首页
          </Link>
        </div>
      </section>
    </main>
  );
}
