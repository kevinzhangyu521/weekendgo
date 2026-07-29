import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAuthWithAdmin } from "@/lib/auth/current-user";

const adminGroups = [
  {
    title: "内容管理",
    links: [
      { href: "/admin/destinations", label: "目的地管理", description: "编辑、上下架和维护前台目的地。" },
      { href: "/admin/submissions", label: "投稿审核", description: "审核用户提交的新地点。" },
      { href: "/admin/home-recommendations", label: "首页推荐管理", description: "配置今日推荐和更多探索。" },
      { href: "/admin/collections", label: "合集管理", description: "维护后台合集和内容工作台。" },
      { href: "/admin/import", label: "内容导入", description: "校验并导入目的地内容数据。" }
    ]
  },
  {
    title: "用户运营",
    links: [
      { href: "/admin/users", label: "用户管理", description: "查看用户资料、角色和站内行为概览。" },
      { href: "/admin/family-experience-applications", label: "体验家庭招募", description: "处理首批体验家庭招募申请。" },
      { href: "/admin/family-destination-experiences", label: "真实体验审核", description: "审核用户提交的真实家庭体验，通过后展示在目的地详情页。" }
    ]
  },
  {
    title: "用户支持",
    links: [
      { href: "/admin/feedback", label: "反馈管理", description: "处理用户提交的问题和建议。" },
      { href: "/notifications", label: "站内通知", description: "查看需要管理员处理的站内消息。" }
    ]
  },
  {
    title: "系统设置",
    links: [
      { href: "/admin/settings", label: "管理员设置", description: "查看当前账号的管理员状态，并进入常用管理功能。" }
    ]
  }
];

export default async function AdminPage() {
  const { user, isAdmin } = await getCurrentAuthWithAdmin();

  if (!user) redirect("/login?next=/admin");

  if (!isAdmin) {
    return (
      <main className="qmd-container py-12">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          <p className="text-sm font-semibold">需要管理员权限</p>
          <h1 className="mt-2 text-2xl font-black text-slate-950">暂时无法打开后台管理</h1>
          <p className="mt-3 text-sm leading-6">当前账号还没有管理员权限，请联系已有管理员确认账号角色。</p>
        </div>
      </main>
    );
  }

  return (
    <main className="qmd-container py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold text-emerald-700">管理员</p>
        <h1 className="mt-1 text-2xl font-black text-slate-950">后台管理</h1>
        <p className="mt-2 text-sm text-slate-500">选择你要处理的管理任务。</p>
      </div>

      <div className="space-y-8">
        {adminGroups.map((group) => (
          <section key={group.title}>
            <h2 className="text-base font-bold text-slate-900">{group.title}</h2>
            <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {group.links.map((item) => (
                <Link key={item.href} href={item.href} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                  <p className="text-base font-bold text-slate-950">{item.label}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
