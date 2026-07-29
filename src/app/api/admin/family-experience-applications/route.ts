import { NextResponse } from "next/server";
import {
  familyExperienceSelectFields,
  normalizeFamilyExperienceApplication,
  type FamilyExperienceApplicationRow
} from "@/features/family-experience/mapper";
import {
  familyExperienceStatusOptions,
  type FamilyExperienceApplicationStatus
} from "@/features/family-experience/types";
import { createNotification } from "@/features/notifications/create-notification";
import { getRequestAuth } from "@/lib/auth/request-auth";

const statusSet = new Set<FamilyExperienceApplicationStatus>(familyExperienceStatusOptions);

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function tableFrom(supabase: Awaited<ReturnType<typeof getRequestAuth>>["supabase"]) {
  return supabase.from("family_experience_applications") as unknown as {
    select: (columns: string) => {
      order: (column: string, options: { ascending: boolean }) => {
        limit: (count: number) => {
          eq: (column: string, value: string) => Promise<{ data: FamilyExperienceApplicationRow[] | null; error: { message: string } | null }>;
        } & PromiseLike<{ data: FamilyExperienceApplicationRow[] | null; error: { message: string } | null }>;
      };
    };
    update: (payload: Record<string, unknown>) => {
      eq: (column: string, value: string) => {
        select: (columns: string) => {
          single: () => Promise<{ data: FamilyExperienceApplicationRow | null; error: { message: string } | null }>;
        };
      };
    };
  };
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
  if (!auth.allowed) return auth.response ?? NextResponse.json({ ok: false, message: "请先登录管理员账号。" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as FamilyExperienceApplicationStatus | null;

  let query = tableFrom(auth.supabase).select(familyExperienceSelectFields).order("created_at", { ascending: false }).limit(200);
  const result = status && statusSet.has(status) ? await query.eq("status", status) : await query;

  if (result.error || !result.data) {
    return NextResponse.json({ ok: false, items: [], message: `读取申请失败：${result.error?.message ?? "没有返回数据"}` }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    items: result.data.map(normalizeFamilyExperienceApplication),
    authSource: auth.authSource
  });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.allowed) return auth.response ?? NextResponse.json({ ok: false, message: "请先登录管理员账号。" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const id = cleanText(body?.id, 80);
  const status = cleanText(body?.status, 50) as FamilyExperienceApplicationStatus;
  const adminNote = cleanText(body?.adminNote, 1200);
  const adminReply = cleanText(body?.adminReply, 1200);

  if (!id) return NextResponse.json({ ok: false, message: "缺少申请 ID。" }, { status: 400 });
  if (!statusSet.has(status)) return NextResponse.json({ ok: false, message: "申请状态不正确。" }, { status: 400 });

  const now = new Date().toISOString();
  const adminUserId = auth.user?.id;
  if (!adminUserId) return NextResponse.json({ ok: false, message: "请先登录管理员账号。" }, { status: 401 });
  const { data, error } = await tableFrom(auth.supabase)
    .update({
      status,
      admin_note: adminNote || null,
      admin_reply: adminReply || null,
      reviewed_by: adminUserId,
      reviewed_at: now,
      status_changed_at: now,
      updated_at: now
    })
    .eq("id", id)
    .select(familyExperienceSelectFields)
    .single();

  if (error || !data) {
    return NextResponse.json({ ok: false, message: `保存处理结果失败：${error?.message ?? "没有返回保存结果"}` }, { status: 500 });
  }

  await createNotification(auth.supabase, {
    role: "user",
    userId: data.user_id,
    type: "family_experience_application_updated",
    title: "你的体验家庭申请有新进度",
    content: adminReply || "管理员已更新你的体验家庭申请状态，请查看最新进度。",
    relatedId: data.id,
    relatedType: "family_experience_application"
  });

  return NextResponse.json({
    ok: true,
    item: normalizeFamilyExperienceApplication(data),
    message: "申请处理结果已保存。"
  });
}
