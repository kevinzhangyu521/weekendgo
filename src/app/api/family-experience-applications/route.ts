import { NextResponse } from "next/server";
import {
  familyExperienceSelectFields,
  normalizeFamilyExperienceApplication,
  type FamilyExperienceApplicationRow
} from "@/features/family-experience/mapper";
import { familyExperienceScenarioOptions } from "@/features/family-experience/types";
import { createNotification } from "@/features/notifications/create-notification";
import { getRequestAuth } from "@/lib/auth/request-auth";

const activeStatuses = ["pending", "in_progress", "approved", "waitlisted"] as const;

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function cleanLongText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function cleanScenarios(value: unknown) {
  if (!Array.isArray(value)) return [];
  const allowed = new Set<string>(familyExperienceScenarioOptions);
  return Array.from(new Set(value.map(String).map((item) => item.trim()).filter((item) => allowed.has(item)))).slice(0, 5);
}

function generateApplicationNo() {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const suffix = Math.random().toString(16).slice(2, 6).toUpperCase();
  return `FE-${yyyy}${mm}${dd}-${suffix}`;
}

function deviceFromRequest(request: Request, bodyDevice: string) {
  if (bodyDevice) return bodyDevice;
  const ua = request.headers.get("user-agent") ?? "";
  if (/mobile|android|iphone|ipad/i.test(ua)) return "mobile";
  return "desktop";
}

function userAgentFromRequest(request: Request) {
  return request.headers.get("user-agent")?.slice(0, 500) ?? "";
}

function tableFrom(supabase: Awaited<ReturnType<typeof getRequestAuth>>["supabase"]) {
  return supabase.from("family_experience_applications") as unknown as {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        in: (column: string, values: readonly string[]) => {
          order: (column: string, options: { ascending: boolean }) => {
            limit: (count: number) => Promise<{ data: FamilyExperienceApplicationRow[] | null; error: { message: string } | null }>;
          };
        };
      };
    };
    insert: (payload: Record<string, unknown>) => {
      select: (columns: string) => {
        single: () => Promise<{ data: FamilyExperienceApplicationRow | null; error: { message: string } | null }>;
      };
    };
  };
}

async function findDuplicate(
  supabase: Awaited<ReturnType<typeof getRequestAuth>>["supabase"],
  userId: string | null,
  contact: string
) {
  const table = tableFrom(supabase);
  if (userId) {
    const { data } = await table
      .select(familyExperienceSelectFields)
      .eq("user_id", userId)
      .in("status", activeStatuses)
      .order("created_at", { ascending: false })
      .limit(1);
    return data?.[0] ?? null;
  }

  const { data } = await table
    .select(familyExperienceSelectFields)
    .eq("contact", contact)
    .in("status", activeStatuses)
    .order("created_at", { ascending: false })
    .limit(1);
  return data?.[0] ?? null;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const parentName = cleanText(body?.parentName, 80);
  const contact = cleanText(body?.contact, 120);
  const city = cleanText(body?.city, 60);
  const childrenAge = cleanText(body?.childrenAge, 80);
  const preferredScenarios = cleanScenarios(body?.preferredScenarios);
  const availableTime = cleanText(body?.availableTime, 120);
  const familySizeValue = Number(body?.familySize);
  const familySize = Number.isFinite(familySizeValue) && familySizeValue >= 1 && familySizeValue <= 20 ? familySizeValue : null;
  const message = cleanLongText(body?.message, 1000);
  const sourcePageUrl = cleanText(body?.sourcePageUrl, 1000);
  const deviceType = deviceFromRequest(request, cleanText(body?.deviceType, 80));
  const userAgent = cleanText(body?.userAgent, 500) || userAgentFromRequest(request);

  if (parentName.length < 2) {
    return NextResponse.json({ ok: false, message: "请填写家长称呼，至少 2 个字。" }, { status: 400 });
  }
  if (contact.length < 5) {
    return NextResponse.json({ ok: false, message: "请填写可联系到你的手机号、微信号或邮箱。" }, { status: 400 });
  }
  if (city.length < 2) {
    return NextResponse.json({ ok: false, message: "请填写所在城市。" }, { status: 400 });
  }
  if (preferredScenarios.length === 0) {
    return NextResponse.json({ ok: false, message: "请至少选择一个感兴趣的出行方向。" }, { status: 400 });
  }

  const { supabase, user, role } = await getRequestAuth(request);
  const duplicate = await findDuplicate(supabase, user?.id ?? null, contact);
  if (duplicate) {
    return NextResponse.json(
      {
        ok: false,
        duplicate: true,
        message: "你已经提交过申请，我们会按最新进度处理。",
        application: normalizeFamilyExperienceApplication(duplicate)
      },
      { status: 409 }
    );
  }

  const now = new Date().toISOString();
  const table = tableFrom(supabase);
  const { data, error } = await table
    .insert({
      application_no: generateApplicationNo(),
      user_id: user?.id ?? null,
      user_email: user?.email ?? null,
      user_name: user?.email?.split("@")[0] ?? parentName,
      user_role: user ? role : "guest",
      parent_name: parentName,
      contact,
      city,
      children_age: childrenAge || null,
      preferred_scenarios: preferredScenarios,
      available_time: availableTime || null,
      family_size: familySize,
      message: message || null,
      source_page_url: sourcePageUrl || null,
      device_type: deviceType || null,
      user_agent: userAgent || null,
      status: "pending",
      status_changed_at: now,
      updated_at: now
    })
    .select(familyExperienceSelectFields)
    .single();

  if (error || !data) {
    return NextResponse.json({ ok: false, message: `申请提交失败：${error?.message ?? "没有返回保存结果"}` }, { status: 500 });
  }

  await createNotification(supabase, {
    role: "admin",
    type: "family_experience_application_created",
    title: "收到新的体验家庭申请",
    content: "有家庭提交了首批体验申请，请及时查看并处理。",
    relatedId: data.id,
    relatedType: "family_experience_application"
  });

  return NextResponse.json({
    ok: true,
    application: normalizeFamilyExperienceApplication(data),
    message: "申请已提交，我们会尽快联系你。"
  });
}
