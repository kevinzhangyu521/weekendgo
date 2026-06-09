import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMyProfile } from "@/features/profiles/repository";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-50">
        <section className="mx-auto max-w-3xl px-4 py-8 md:px-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">{"\u6211\u7684\u8d44\u6599"}</h1>
            <p className="mt-2 text-sm text-slate-600">{"\u8bf7\u5148\u767b\u5f55\uff0c\u7136\u540e\u5b8c\u5584\u4f60\u7684\u5bb6\u5ead\u6237\u5916\u504f\u597d\u3002"}</p>
            <Link href="/login?next=/profile" className="mt-4 inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
              {"\u53bb\u767b\u5f55"}
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const profile = await getMyProfile();
  if (!profile) return null;

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-3xl px-4 py-6 md:px-6">
        <p className="text-sm text-slate-500">{"我的资料"}</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">{"\u6211\u7684\u8d44\u6599"}</h1>
        <p className="mt-2 text-sm text-slate-600">{"\u8fd9\u4e9b\u4fe1\u606f\u5c06\u7528\u4e8e\u540e\u7eed\u63a8\u8350\u66f4\u9002\u5408\u4f60\u5bb6\u5ead\u7684\u5468\u672b\u6237\u5916\u5730\u70b9\u3002"}</p>
        <Link href="/reset-password" className="mt-4 inline-flex rounded-lg border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-700">
          {"修改密码"}
        </Link>
        <ProfileForm profile={profile} />
      </section>
    </main>
  );
}
