import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ClaimAdminForm } from "./claim-admin-form";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data: currentAdmin } = user ? await supabase.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle() : { data: null };

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        <p className="text-sm text-slate-500">{"栖美地 Admin"}</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">{"管理员设置"}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {"用于在网站内部恢复或初始化管理员权限。为了安全，只有系统还没有管理员时，当前登录账号才能成为首个管理员。"}
        </p>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          {!user ? (
            <div>
              <p className="font-semibold text-slate-900">{"请先登录"}</p>
              <p className="mt-2 text-sm text-slate-600">{"登录后再回到本页面设置管理员。"}</p>
              <Link href="/login?next=/admin/settings" className="mt-4 inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
                {"去登录"}
              </Link>
            </div>
          ) : currentAdmin ? (
            <div>
              <p className="font-semibold text-emerald-700">{"当前账号已经是管理员"}</p>
              <p className="mt-2 text-sm text-slate-600">{user.email}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/admin/submissions" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
                  {"审核投稿"}
                </Link>
                <Link href="/admin/destinations" className="rounded-lg border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700">
                  {"目的地管理"}
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-slate-600">{"当前账号"}</p>
              <p className="mt-1 font-semibold text-slate-900">{user.email}</p>
              <ClaimAdminForm />
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
