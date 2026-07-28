import { NextResponse } from "next/server";
import {
  familyDestinationExperienceAdminSelectFields,
  normalizeFamilyDestinationExperience,
  type FamilyDestinationExperienceRow
} from "@/features/family-destination-experiences/mapper";
import { getRequestAuth } from "@/lib/auth/request-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { supabase, user } = await getRequestAuth(request);
  if (!user) return NextResponse.json({ ok: false, items: [], message: "请先登录。" }, { status: 401 });

  const { data, error } = await supabase
    .from("family_destination_experiences")
    .select(familyDestinationExperienceAdminSelectFields)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !data) {
    return NextResponse.json({ ok: false, items: [], message: `读取我的体验失败：${error?.message ?? "没有返回数据"}` }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    items: (data as FamilyDestinationExperienceRow[]).map(normalizeFamilyDestinationExperience)
  });
}
