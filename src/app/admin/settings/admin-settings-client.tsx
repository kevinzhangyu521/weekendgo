"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Status = "loading" | "signed_out" | "ready" | "admin" | "error";

export function AdminSettingsClient() {
  const supabase = useMemo(() => createClient(), []);
  const [status, setStatus] = useState<Status>("loading");
  const [email, setEmail] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function refresh() {
    setStatus("loading");
    setMessage("");

    const {
      data: { user },
      error
    } = await supabase.auth.getUser();

    if (error || !user) {
      setEmail(null);
      setStatus("signed_out");
      return;
    }

    setEmail(user.email ?? null);

    const { data, error: adminError } = await supabase.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();

    if (adminError) {
      setStatus("ready");
      return;
    }

    setStatus(data ? "admin" : "ready");
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function claimAdmin() {
    setSubmitting(true);
    setMessage("");

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      setStatus("signed_out");
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from("admin_users").insert({
      user_id: user.id,
      email: user.email ?? null
    });

    if (error) {
      setMessage("设置失败：如果系统里已经存在管理员，需要由现有管理员操作，或在 Supabase 里手动恢复。");
      setStatus("error");
      setSubmitting(false);
      return;
    }

    window.localStorage.setItem("qimeide_auth_email", user.email ?? "");
    setMessage("管理员设置成功。请刷新页面后进入审核投稿或目的地管理。");
    setStatus("admin");
    setSubmitting(false);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        <p className="text-sm text-slate-500">{"栖美地 Admin"}</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">{"管理员设置"}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {"用于在网站内部恢复或初始化管理员权限。为了安全，只有系统还没有管理员时，当前登录账号才能成为首个管理员。"}
        </p>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          {status === "loading" ? <p className="text-sm text-slate-600">{"正在读取登录状态..."}</p> : null}

          {status === "signed_out" ? (
            <div>
              <p className="font-semibold text-slate-900">{"请先登录"}</p>
              <p className="mt-2 text-sm text-slate-600">{"登录后再回到本页面设置管理员。"}</p>
              <Link href="/login?next=/admin/settings" className="mt-4 inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
                {"去登录"}
              </Link>
            </div>
          ) : null}

          {status === "ready" || status === "error" ? (
            <div>
              <p className="text-sm text-slate-600">{"当前账号"}</p>
              <p className="mt-1 font-semibold text-slate-900">{email}</p>
              <button
                type="button"
                onClick={claimAdmin}
                disabled={submitting}
                className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {submitting ? "设置中..." : "将当前账号设为管理员"}
              </button>
            </div>
          ) : null}

          {status === "admin" ? (
            <div>
              <p className="font-semibold text-emerald-700">{"当前账号已经是管理员"}</p>
              <p className="mt-2 text-sm text-slate-600">{email}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/admin/submissions" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
                  {"审核投稿"}
                </Link>
                <Link href="/admin/destinations" className="rounded-lg border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700">
                  {"目的地管理"}
                </Link>
              </div>
            </div>
          ) : null}

          {message ? <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{message}</p> : null}
        </div>
      </section>
    </main>
  );
}
