"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AdminDestination } from "@/features/admin/destinations";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { EditDestinationForm } from "@/app/admin/destinations/[id]/edit/edit-destination-form";

type DestinationResponse = {
  ok?: boolean;
  item?: AdminDestination | null;
  message?: string;
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

export function AdminEditDestinationClient({ id }: { id: string }) {
  const currentUser = useCurrentUser();
  const [item, setItem] = useState<AdminDestination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function loadItem() {
      if (currentUser.isLoading) return;
      if (!currentUser.isAuthenticated) {
        setLoading(false);
        setError("\u8bf7\u5148\u767b\u5f55\u7ba1\u7406\u5458\u8d26\u53f7\u3002");
        return;
      }

      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/admin/destinations/${id}`, {
          headers: await authHeaders(),
          credentials: "include",
          cache: "no-store"
        });
        const result = (await response.json()) as DestinationResponse;
        if (!response.ok || !result.ok || !result.item) throw new Error(result.message ?? "\u8bfb\u53d6\u76ee\u7684\u5730\u5931\u8d25\u3002");
        if (mounted) setItem(result.item);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "\u8bfb\u53d6\u76ee\u7684\u5730\u5931\u8d25\u3002");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadItem();
    return () => {
      mounted = false;
    };
  }, [currentUser.isAuthenticated, currentUser.isLoading, id]);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="qmd-container py-6">
        <Link href="/admin/destinations" className="text-sm text-emerald-700 hover:underline">
          {"\u8fd4\u56de\u76ee\u7684\u5730\u7ba1\u7406"}
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">{"\u7f16\u8f91\u76ee\u7684\u5730"}</h1>
        <p className="mt-2 text-sm text-slate-600">{"\u4fee\u6539\u540e\u4f1a\u7acb\u5373\u5f71\u54cd\u524d\u53f0\u76ee\u7684\u5730\u5217\u8868\u3001\u8be6\u60c5\u9875\u3001\u5730\u56fe\u548c\u8ba1\u5212\u9875\u3002"}</p>

        {loading ? <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">{"\u6b63\u5728\u8bfb\u53d6..."}</div> : null}
        {error ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-amber-700">{"\u6682\u65f6\u65e0\u6cd5\u7f16\u8f91"}</p>
            <p className="mt-2 text-slate-700">{error}</p>
            <Link href="/admin/destinations" className="mt-5 inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
              {"\u8fd4\u56de\u76ee\u7684\u5730\u7ba1\u7406"}
            </Link>
          </div>
        ) : null}
        {item ? <EditDestinationForm item={item} /> : null}
      </section>
    </main>
  );
}
