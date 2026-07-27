import Link from "next/link";

type Props = {
  title: string;
  description: string;
  loginHref: string;
};

export function AuthSyncRequired({ title, description, loginHref }: Props) {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-3xl px-4 py-8 md:px-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="mt-2 text-sm text-slate-600">{description}</p>
          <Link href={loginHref} className="mt-4 inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
            登录后继续
          </Link>
        </div>
      </section>
    </main>
  );
}
