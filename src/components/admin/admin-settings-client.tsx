"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { ClaimAdminForm } from "@/app/admin/settings/claim-admin-form";

type AdminMeResponse = {
  ok?: boolean;
  isAdmin?: boolean;
  role?: string;
  email?: string | null;
};

async function authHeaders() {
  const supabase = createClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();
  const headers: Record<string, string> = {};
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
  return headers;
}

export function AdminSettingsClient() {
  const currentUser = useCurrentUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadAdmin() {
      if (currentUser.isLoading) return;
      if (!currentUser.isAuthenticated) {
        setLoading(false);
        setIsAdmin(false);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch("/api/admin/me", {
          headers: await authHeaders(),
          credentials: "include",
          cache: "no-store"
        });
        const result = (await response.json()) as AdminMeResponse;
        if (!mounted) return;
        setIsAdmin(Boolean(result.isAdmin));
        setEmail(result.email ?? currentUser.email);
      } catch {
        if (mounted) setIsAdmin(false);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadAdmin();
    return () => {
      mounted = false;
    };
  }, [currentUser.email, currentUser.isAuthenticated, currentUser.isLoading]);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="qmd-container py-10">
        <h1 className="text-2xl font-bold text-slate-900">{"\u7ba1\u7406\u5458\u8bbe\u7f6e"}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{"\u7528\u4e8e\u67e5\u770b\u5f53\u524d\u8d26\u53f7\u7684\u7ba1\u7406\u5458\u72b6\u6001\u3002"}</p>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          {loading ? (
            <p className="text-sm text-slate-600">{"\u6b63\u5728\u8bfb\u53d6\u7ba1\u7406\u5458\u72b6\u6001..."}</p>
          ) : !currentUser.isAuthenticated ? (
            <div>
              <p className="font-semibold text-slate-900">{"\u8bf7\u5148\u767b\u5f55"}</p>
              <p className="mt-2 text-sm text-slate-600">{"\u767b\u5f55\u540e\u518d\u56de\u5230\u672c\u9875\u9762\u67e5\u770b\u7ba1\u7406\u5458\u72b6\u6001\u3002"}</p>
              <Link href="/login?next=/admin/settings" className="mt-4 inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
                {"\u53bb\u767b\u5f55"}
              </Link>
            </div>
          ) : isAdmin ? (
            <div>
              <p className="font-semibold text-emerald-700">{"\u5f53\u524d\u8d26\u53f7\u5df2\u7ecf\u662f\u7ba1\u7406\u5458"}</p>
              <p className="mt-2 text-sm text-slate-600">{email}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/admin/submissions" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">{"\u5ba1\u6838\u6295\u7a3f"}</Link>
                <Link href="/admin/destinations" className="rounded-lg border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700">{"\u76ee\u7684\u5730\u7ba1\u7406"}</Link>
              </div>
            </div>
          ) : (
            <div>
              <p className="font-semibold text-amber-800">{"\u5f53\u524d\u8d26\u53f7\u8fd8\u4e0d\u662f\u7ba1\u7406\u5458"}</p>
              <p className="mt-2 text-sm text-slate-600">{email ?? currentUser.email}</p>
              <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{"\u7ba1\u7406\u5458\u6743\u9650\u73b0\u5728\u4ee5 user_profiles.role \u4e3a\u51c6\u3002\u5982\u679c\u7cfb\u7edf\u8fd8\u6ca1\u6709\u7ba1\u7406\u5458\uff0c\u53ef\u4ee5\u5728\u672c\u9875\u521d\u59cb\u5316\u7b2c\u4e00\u4e2a\u7ba1\u7406\u5458\u3002"}</p>
              <ClaimAdminForm />
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
