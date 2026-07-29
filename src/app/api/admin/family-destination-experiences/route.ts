import { NextResponse } from "next/server";
import {
  familyDestinationExperienceAdminSelectFields,
  normalizeFamilyDestinationExperience,
  type FamilyDestinationExperienceRow
} from "@/features/family-destination-experiences/mapper";
import {
  familyDestinationExperienceStatusOptions,
  type FamilyDestinationExperienceStatus
} from "@/features/family-destination-experiences/types";
import { createNotification } from "@/features/notifications/create-notification";
import { getRequestAuth } from "@/lib/auth/request-auth";

const statusSet = new Set<FamilyDestinationExperienceStatus>(familyDestinationExperienceStatusOptions);

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

async function requireAdmin(request: Request) {
  const auth = await getRequestAuth(request);
  if (!auth.user) return { ...auth, allowed: false, response: NextResponse.json({ ok: false, message: "请先登录管理员账号。" }, { status: 401 }) };
  if (!auth.isAdmin) return { ...auth, allowed: false, response: NextResponse.json({ ok: false, message: "你没有管理员权限。" }, { status: 403 }) };
  return { ...auth, allowed: true, response: null };
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.allowed) return auth.response ?? NextResponse.json({ ok: false, items: [] }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as FamilyDestinationExperienceStatus | null;

  let query = auth.supabase
    .from("family_destination_experiences")
    .select(familyDestinationExperienceAdminSelectFields)
    .order("created_at", { ascending: false })
    .limit(200);

  if (status && statusSet.has(status)) query = query.eq("status", status);

  const { data, error } = await query;
  if (error || !data) {
    return NextResponse.json({ ok: false, items: [], message: `读取体验失败：${error?.message ?? "没有返回数据"}` }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    items: (data as FamilyDestinationExperienceRow[]).map(normalizeFamilyDestinationExperience)
  });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.allowed) return auth.response ?? NextResponse.json({ ok: false }, { status: 401 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const id = cleanText(body?.id, 80);
  const status = cleanText(body?.status, 30) as FamilyDestinationExperienceStatus;

  if (!id) return NextResponse.json({ ok: false, message: "缺少体验 ID。" }, { status: 400 });
  if (!statusSet.has(status)) return NextResponse.json({ ok: false, message: "状态不正确。" }, { status: 400 });

  const { data, error } = await auth.supabase
    .from("family_destination_experiences")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(familyDestinationExperienceAdminSelectFields)
    .single();

  if (error || !data) {
    return NextResponse.json({ ok: false, message: `保存审核结果失败：${error?.message ?? "没有返回保存结果"}` }, { status: 500 });
  }

  const item = normalizeFamilyDestinationExperience(data as FamilyDestinationExperienceRow);

  if (status === "approved") {
    await createNotification(auth.supabase, {
      role: "user",
      userId: item.userId,
      type: "family_destination_experience_approved",
      title: "你的真实家庭体验已通过",
      content: "你提交的真实家庭体验已审核通过，会展示在目的地详情页。",
      relatedId: item.id,
      relatedType: "family_destination_experience"
    });
  }

  if (status === "rejected") {
    await createNotification(auth.supabase, {
      role: "user",
      userId: item.userId,
      type: "family_destination_experience_rejected",
      title: "你的真实家庭体验暂未通过",
      content: "你提交的真实家庭体验暂未通过审核，可根据实际情况重新整理后再提交。",
      relatedId: item.id,
      relatedType: "family_destination_experience"
    });
  }

  return NextResponse.json({
    ok: true,
    item,
    message: "审核结果已保存。"
  });
}
