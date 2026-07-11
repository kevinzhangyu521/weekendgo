import { NextResponse } from "next/server";
import {
  familyExperienceSelectFields,
  normalizeFamilyExperienceApplication,
  type FamilyExperienceApplicationRow
} from "@/features/family-experience/mapper";
import { getRequestAuth } from "@/lib/auth/request-auth";

function tableFrom(supabase: Awaited<ReturnType<typeof getRequestAuth>>["supabase"]) {
  return supabase.from("family_experience_applications") as unknown as {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        order: (column: string, options: { ascending: boolean }) => {
          limit: (count: number) => Promise<{ data: FamilyExperienceApplicationRow[] | null; error: { message: string } | null }>;
        };
      };
    };
  };
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { supabase, user, authSource } = await getRequestAuth(request);
  if (!user) {
    return NextResponse.json({ ok: true, items: [], authSource, message: "未登录用户暂无站内申请记录。" });
  }

  const { data, error } = await tableFrom(supabase)
    .select(familyExperienceSelectFields)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error || !data) {
    return NextResponse.json({ ok: false, items: [], message: `读取申请状态失败：${error?.message ?? "没有返回数据"}` }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    items: data.map(normalizeFamilyExperienceApplication),
    authSource
  });
}
