"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { hasLocalAuthState } from "@/lib/auth/client-auth-state";
import { syncBrowserSessionToServer } from "@/lib/auth/sync-browser-session";

type Props = {
  title: string;
  description: string;
  loginHref: string;
};

export function AuthSyncRequired({ title, description, loginHref }: Props) {
  const router = useRouter();
  const [hasLocalLogin, setHasLocalLogin] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const localLogin = hasLocalAuthState();
    setHasLocalLogin(localLogin);
    if (!localLogin) return;

    let cancelled = false;

    async function sync() {
      setSyncing(true);
      const ok = await syncBrowserSessionToServer();
      if (cancelled) return;
      if (ok) {
        router.refresh();
      } else {
        setFailed(true);
        setSyncing(false);
      }
    }

    void sync();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-3xl px-4 py-8 md:px-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          {hasLocalLogin && !failed ? (
            <p className="mt-2 text-sm text-slate-600">{syncing ? "正在恢复登录状态，请稍候..." : "正在检查登录状态..."}</p>
          ) : (
            <p className="mt-2 text-sm text-slate-600">{failed ? "登录状态恢复失败，请重新登录一次。" : description}</p>
          )}
          {hasLocalLogin && !failed ? null : (
            <Link href={loginHref} className="mt-4 inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
              {"去登录"}
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
