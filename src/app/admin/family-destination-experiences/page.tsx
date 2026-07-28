import { redirect } from "next/navigation";
import { FamilyDestinationExperiencesAdminClient } from "@/components/admin/family-destination-experiences-admin-client";
import { getCurrentAuthWithAdmin } from "@/lib/auth/current-user";

export default async function AdminFamilyDestinationExperiencesPage() {
  const { user, isAdmin } = await getCurrentAuthWithAdmin();

  if (!user) redirect("/login?next=/admin/family-destination-experiences");

  if (!isAdmin) {
    return (
      <main className="qmd-container py-12">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          <p className="text-sm font-semibold">需要管理员权限</p>
          <h1 className="mt-2 text-2xl font-black text-slate-950">暂时无法打开体验审核</h1>
          <p className="mt-3 text-sm leading-6">当前账号不是管理员，不能审核用户提交的真实家庭体验。</p>
        </div>
      </main>
    );
  }

  return <FamilyDestinationExperiencesAdminClient />;
}
