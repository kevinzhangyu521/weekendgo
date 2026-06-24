import Link from "next/link";
import { PasswordLoginForm } from "@/components/auth/password-login-form";
import { getCurrentUser } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function safeNextPath(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/login")) return "/";
  return value;
}

export default async function LoginPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const params = searchParams ? await searchParams : {};
  const user = await getCurrentUser();
  const next = safeNextPath(firstParam(params.next));
  const loginError = firstParam(params.loginError);
  const registered = firstParam(params.registered) === "1";

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto flex max-w-md flex-col px-4 py-10 md:px-0">
        <h1 className="text-2xl font-bold text-slate-900">邮箱密码登录</h1>
        <p className="mt-2 text-sm text-slate-600">登录后可收藏地点、加入计划、查看反馈进度。</p>

        {user ? (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <p className="font-semibold">当前已登录</p>
            <p className="mt-1">{user.email}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/" className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white">
                进入首页
              </Link>
              <Link href="/auth/sign-out" className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-medium text-emerald-700">
                退出登录
              </Link>
            </div>
          </div>
        ) : null}

        {registered ? (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            注册成功，请登录。
          </div>
        ) : null}

        <PasswordLoginForm next={next} loginError={loginError} />

        <div className="mt-4 flex items-center gap-3 text-sm">
          <Link href={next} className="text-emerald-700 hover:underline">
            返回
          </Link>
          <Link href="/" className="text-slate-600 hover:underline">
            首页
          </Link>
        </div>
      </section>
    </main>
  );
}
