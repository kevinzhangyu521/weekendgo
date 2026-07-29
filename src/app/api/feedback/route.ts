import { NextResponse } from "next/server";
import type { FeedbackType } from "@/features/feedback/types";
import { createNotification } from "@/features/notifications/create-notification";
import { getRequestAuth } from "@/lib/auth/request-auth";

const feedbackTypes = new Set<FeedbackType>(["bug", "place_error", "feature", "experience", "other"]);

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function getHeaderUserAgent(request: Request) {
  return request.headers.get("user-agent")?.slice(0, 500) ?? "";
}

function generateFeedbackNo() {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const suffix = Math.random().toString(16).slice(2, 6).toUpperCase();
  return `QM-${yyyy}${mm}${dd}-${suffix}`;
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
    return NextResponse.json({ ok: false, message: "\u8bf7\u9009\u62e9\u53cd\u9988\u7c7b\u578b\u3002" }, { status: 400 });
  }

  if (content.length < 5) {
    return NextResponse.json({ ok: false, message: "\u8bf7\u81f3\u5c11\u586b\u5199 5 \u4e2a\u5b57\uff0c\u65b9\u4fbf\u6211\u4eec\u5b9a\u4f4d\u95ee\u9898\u3002" }, { status: 400 });
  }

  const { supabase, user } = await getRequestAuth(request);
  const userEmail = user?.email ?? null;
  const userName = userEmail?.split("@")[0] ?? null;
  const userRole = user ? "user" : "guest";
  const feedbackId = crypto.randomUUID();
  const feedbackNo = generateFeedbackNo();
  const now = new Date().toISOString();

  const { error } = await supabase.from("feedbacks").insert({
    id: feedbackId,
    feedback_no: feedbackNo,
    user_id: user?.id ?? null,
    user_email: userEmail,
    user_name: userName,
    user_role: userRole,
    type,
    content,
    contact: contact || userEmail,
    page_url: pageUrl || null,
    device_type: deviceType || null,
    user_agent: userAgent || null,
    status: "pending",
    status_changed_at: now,
    wechat_notify_reserved: {}
  });

  if (error) {
    return NextResponse.json({ ok: false, message: "\u53cd\u9988\u63d0\u4ea4\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002" }, { status: 500 });
  }

  await createNotification(supabase, {
    role: "admin",
    type: "feedback_created",
    title: "\u6536\u5230\u65b0\u7684\u7528\u6237\u53cd\u9988",
    content: "\u7528\u6237\u63d0\u4ea4\u4e86\u65b0\u7684\u53cd\u9988\uff0c\u8bf7\u53ca\u65f6\u5904\u7406\u3002",
    relatedId: feedbackId,
    relatedType: "feedback"
  });

  return NextResponse.json({
    ok: true,
    feedbackId,
    feedbackNo,
    message: `\u53cd\u9988\u5df2\u63d0\u4ea4\uff0c\u7f16\u53f7\uff1a${feedbackNo}`
  });
}
