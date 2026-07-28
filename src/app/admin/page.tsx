import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAuthWithAdmin } from "@/lib/auth/current-user";

const adminLinks = [
  { href: "/admin/destinations", label: "\u7ba1\u7406\u6240\u6709\u76ee\u7684\u5730", description: "\u7f16\u8f91\u3001\u4e0a\u4e0b\u67b6\u548c\u7ef4\u62a4\u524d\u53f0\u76ee\u7684\u5730\u3002" },
  { href: "/admin/submissions", label: "\u7ba1\u7406\u6295\u7a3f", description: "\u5ba1\u6838\u7528\u6237\u63d0\u4ea4\u7684\u65b0\u5730\u70b9\u3002" },
  { href: "/admin/feedback", label: "\u7ba1\u7406\u53cd\u9988", description: "\u5904\u7406\u7528\u6237\u63d0\u4ea4\u7684\u95ee\u9898\u548c\u5efa\u8bae\u3002" },
  { href: "/admin/family-experience-applications", label: "体验家庭申请", description: "处理首批体验家庭招募申请。" },
  { href: "/admin/family-destination-experiences", label: "体验审核", description: "审核用户提交的真实家庭体验，通过后展示在目的地详情页。" },
  { href: "/admin/home-recommendations", label: "\u9996\u9875\u63a8\u8350\u7ba1\u7406", description: "\u914d\u7f6e\u4eca\u65e5\u63a8\u8350\u548c\u66f4\u591a\u63a2\u7d22\u3002" },
  { href: "/admin/settings", label: "\u7ba1\u7406\u5458\u8bbe\u7f6e", description: "\u67e5\u770b\u5f53\u524d\u8d26\u53f7\u7684\u7ba1\u7406\u5458\u72b6\u6001\uff0c\u5e76\u8fdb\u5165\u5e38\u7528\u7ba1\u7406\u529f\u80fd\u3002" },
  { href: "/notifications", label: "\u7cfb\u7edf\u901a\u77e5", description: "\u67e5\u770b\u9700\u8981\u7ba1\u7406\u5458\u5904\u7406\u7684\u7ad9\u5185\u4fe1\u3002" }
];

export default async function AdminPage() {
  const { user, isAdmin } = await getCurrentAuthWithAdmin();

  if (!user) redirect("/login?next=/admin");

  if (!isAdmin) {
    return (
      <main className="qmd-container py-12">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          <p className="text-sm font-semibold">\u9700\u8981\u7ba1\u7406\u5458\u6743\u9650</p>
          <h1 className="mt-2 text-2xl font-black text-slate-950">\u6682\u65f6\u65e0\u6cd5\u6253\u5f00\u540e\u53f0\u7ba1\u7406</h1>
          <p className="mt-3 text-sm leading-6">\u5f53\u524d\u8d26\u53f7\u4e0d\u662f\u7ba1\u7406\u5458\u3002\u8bf7\u786e\u8ba4 user_profiles.role \u5df2\u8bbe\u7f6e\u4e3a admin\u3002</p>
        </div>
      </main>
    );
  }

  return (
    <main className="qmd-container py-10">
      <div className="mb-6">
        <p className="text-sm font-semibold text-emerald-700">\u7ba1\u7406\u5458</p>
        <h1 className="mt-1 text-2xl font-black text-slate-950">\u540e\u53f0\u7ba1\u7406</h1>
        <p className="mt-2 text-sm text-slate-500">\u9009\u62e9\u4f60\u8981\u5904\u7406\u7684\u7ba1\u7406\u4efb\u52a1\u3002</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {adminLinks.map((item) => (
          <Link key={item.href} href={item.href} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <p className="text-base font-bold text-slate-950">{item.label}</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
