import { NextResponse } from "next/server";
import type { FeedbackType } from "@/features/feedback/types";
import { getRequestAuth } from "@/lib/auth/request-auth";

const feedbackTypes = new Set<FeedbackType>(["bug", "place_error", "feature", "experience", "other"]);

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function getHeaderUserAgent(request: Request) {
  return request.headers.get("user-agent")?.slice(0, 500) ?? "";
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const type = cleanText(body?.type, 50) as FeedbackType;
  const content = cleanText(body?.content, 2000);
  const contact = cleanText(body?.contact, 200);
  const pageUrl = cleanText(body?.pageUrl, 1000);
  const deviceType = cleanText(body?.deviceType, 100);
  const userAgent = cleanText(body?.userAgent, 500) || getHeaderUserAgent(request);

  if (!feedbackTypes.has(type)) {
    return NextResponse.json({ ok: false, message: "请选择反馈类型。" }, { status: 400 });
  }

  if (content.length < 5) {
    return NextResponse.json({ ok: false, message: "请至少填写 5 个字，方便我们定位问题。" }, { status: 400 });
  }

  const { supabase, user } = await getRequestAuth(request);
  const { error } = await supabase.from("feedbacks").insert({
    user_id: user?.id ?? null,
    type,
    content,
    contact: contact || null,
    page_url: pageUrl || null,
    device_type: deviceType || null,
    user_agent: userAgent || null
  });

  if (error) {
    return NextResponse.json({ ok: false, message: "反馈提交失败，请稍后再试。" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: "反馈已提交，感谢你的帮助。" });
}
