import Link from "next/link";
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

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto flex max-w-md flex-col px-4 py-10 md:px-0">
        <p className="text-sm text-slate-500">栖美地账号</p>
        <h1 className="text-2xl font-bold text-slate-900">邮箱密码登录</h1>
        <p className="mt-2 text-sm text-slate-600">使用邮箱和密码登录栖美地。</p>

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

        <form action="/auth/password-login" method="post" className="mt-6 space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <input type="hidden" name="next" value={next} />
          <label className="text-sm font-bold text-slate-900" htmlFor="email">
            邮箱
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="例如：yourname@qq.com"
            className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-emerald-500"
          />

          <label className="text-sm font-bold text-slate-900" htmlFor="password">
            密码
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            placeholder="至少 6 位，建议安全好记"
            className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-emerald-500"
          />

          <button type="submit" className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white">
            登录
          </button>

          <Link href="/reset-password" className="block text-center text-sm text-emerald-700 hover:underline">
            忘记密码？
          </Link>

          {loginError ? <p className="text-sm text-rose-600">登录失败：{loginError}</p> : null}
        </form>

        <div className="mt-4 flex items-center gap-3 text-sm">
          <Link href={next} className="text-emerald-700 hover:underline">
            返回
          </Link>
          <Link href="/" className="text-slate-600 hover:underline">
            首页
          </Link>
        </div>
        <p className="mt-3 text-center text-[11px] text-slate-400">login-server-form-2026-06-11-v4</p>
      </section>
    </main>
  );
}
