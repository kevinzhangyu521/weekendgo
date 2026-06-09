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

function clearLocalAuthState() {
  window.localStorage.removeItem("qimeide_auth_email");
  window.localStorage.removeItem("qimeide_is_admin");
  document.cookie = "qimeide_auth_email=; Path=/; Max-Age=0; SameSite=Lax";
}

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
      const ok = await syncBrowserSessionToServer().catch(() => false);
      if (cancelled) return;

      if (ok) {
        router.refresh();
        return;
      }

      clearLocalAuthState();
      setHasLocalLogin(false);
      setFailed(true);
      setSyncing(false);
    }

    void sync();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const message =
    hasLocalLogin && !failed
      ? syncing
        ? "正在恢复登录状态，请稍候..."
        : "正在检查登录状态..."
      : failed
        ? "登录状态已过期，请重新登录一次。"
        : description;

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-3xl px-4 py-8 md:px-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="mt-2 text-sm text-slate-600">{message}</p>
          {hasLocalLogin && !failed ? null : (
            <Link href={loginHref} className="mt-4 inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
              去登录
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
