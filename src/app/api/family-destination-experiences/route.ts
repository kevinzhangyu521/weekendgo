import { NextResponse } from "next/server";
import type { FamilyDestinationExperienceChildAgeGroup } from "@/features/family-destination-experiences/types";
import { createNotification } from "@/features/notifications/create-notification";
import { getRequestAuth } from "@/lib/auth/request-auth";

type Payload = {
  destinationId?: string;
  childAgeGroup?: string;
  visitedAt?: string | null;
  recommendation?: string;
  tip?: string;
};

type InsertedExperience = {
  id: string;
};

const ageGroups = new Set<FamilyDestinationExperienceChildAgeGroup>(["0-3", "3-6", "6-12", "12+"]);

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function cleanDate(value: unknown) {
  const text = cleanText(value, 20);
  if (!text) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  const { supabase, user } = await getRequestAuth(request);
  if (!user) return NextResponse.json({ ok: false, message: "请先登录后再提交体验。" }, { status: 401 });

  const payload = (await request.json().catch(() => null)) as Payload | null;
  if (!payload) return NextResponse.json({ ok: false, message: "请求格式不正确。" }, { status: 400 });

  const destinationId = cleanText(payload.destinationId, 80);
  const childAgeGroup = cleanText(payload.childAgeGroup, 20) as FamilyDestinationExperienceChildAgeGroup;
  const recommendation = cleanText(payload.recommendation, 300);
  const tip = cleanText(payload.tip, 300);
  const visitedAt = cleanDate(payload.visitedAt);

  if (!destinationId) return NextResponse.json({ ok: false, message: "缺少目的地信息。" }, { status: 400 });
  if (!ageGroups.has(childAgeGroup)) return NextResponse.json({ ok: false, message: "请选择孩子年龄段。" }, { status: 400 });
  if (recommendation.length < 4) return NextResponse.json({ ok: false, message: "推荐内容至少 4 个字。" }, { status: 400 });
  if (tip.length < 4) return NextResponse.json({ ok: false, message: "提醒内容至少 4 个字。" }, { status: 400 });

  const { data, error } = await (supabase.from("family_destination_experiences") as unknown as {
    insert: (payload: Record<string, unknown>) => {
      select: (columns: string) => {
        single: () => Promise<{ data: InsertedExperience | null; error: { message: string } | null }>;
      };
    };
  })
    .insert({
      destination_id: destinationId,
      user_id: user.id,
      child_age_group: childAgeGroup,
      visited_at: visitedAt,
      recommendation,
      tip,
      status: "pending",
      updated_at: new Date().toISOString()
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ ok: false, message: `提交失败：${error.message}` }, { status: 500 });

  if (data?.id) {
    await createNotification(supabase, {
      role: "admin",
      type: "family_destination_experience_created",
      title: "收到新的真实家庭体验",
      content: "用户提交了新的目的地真实体验，请及时审核。",
      relatedId: data.id,
      relatedType: "family_destination_experience"
    });
  }

  return NextResponse.json({ ok: true, message: "已提交，审核通过后会展示在目的地详情页。" });
}
