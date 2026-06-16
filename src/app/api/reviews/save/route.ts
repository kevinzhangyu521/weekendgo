import { NextResponse } from "next/server";
import { getRequestAuth } from "@/lib/auth/request-auth";

type ReviewPayload = {
  destinationId?: string;
  rating?: number;
  content?: string;
  suitableAge?: string;
  parkingRating?: string;
  toiletRating?: string;
  safetyNote?: string;
  recommend?: boolean | null;
  visitDate?: string | null;
};

const ageValues = new Set(["0-3", "3-6", "6-12", "12+"]);
const parkingValues = new Set(["easy", "normal", "hard"]);
const toiletValues = new Set(["good", "normal", "poor"]);

export const dynamic = "force-dynamic";
export const revalidate = 0;

function cleanOptional(value: unknown) {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
}

export async function POST(request: Request) {
  let payload: ReviewPayload = {};

  try {
    payload = (await request.json()) as ReviewPayload;
  } catch {
    return NextResponse.json({ ok: false, message: "请求格式不正确。" }, { status: 400 });
  }

  const destinationId = cleanOptional(payload.destinationId);
  const rating = Number(payload.rating ?? 0);
  const content = cleanOptional(payload.content) ?? "";
  const suitableAge = cleanOptional(payload.suitableAge);
  const parkingRating = cleanOptional(payload.parkingRating);
  const toiletRating = cleanOptional(payload.toiletRating);
  const safetyNote = cleanOptional(payload.safetyNote);
  const visitDate = cleanOptional(payload.visitDate);

  if (!destinationId) return NextResponse.json({ ok: false, message: "缺少目的地信息。" }, { status: 400 });
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return NextResponse.json({ ok: false, message: "请选择 1-5 星评分。" }, { status: 400 });
  if (content.length < 4) return NextResponse.json({ ok: false, message: "请至少写 4 个字，方便其他家庭参考。" }, { status: 400 });
  if (content.length > 500) return NextResponse.json({ ok: false, message: "体验内容请控制在 500 字以内。" }, { status: 400 });
  if (safetyNote && safetyNote.length > 200) return NextResponse.json({ ok: false, message: "安全提醒请控制在 200 字以内。" }, { status: 400 });
  if (suitableAge && !ageValues.has(suitableAge)) return NextResponse.json({ ok: false, message: "适合年龄格式不正确。" }, { status: 400 });
  if (parkingRating && !parkingValues.has(parkingRating)) return NextResponse.json({ ok: false, message: "停车信息格式不正确。" }, { status: 400 });
  if (toiletRating && !toiletValues.has(toiletRating)) return NextResponse.json({ ok: false, message: "厕所信息格式不正确。" }, { status: 400 });

  const { supabase, user } = await getRequestAuth(request);
  if (!user) return NextResponse.json({ ok: false, message: "请先登录后再提交体验。" }, { status: 401 });

  const { error } = await supabase.from("destination_reviews").upsert(
    {
      destination_id: destinationId,
      user_id: user.id,
      rating,
      content,
      suitable_age: suitableAge,
      parking_rating: parkingRating,
      toilet_rating: toiletRating,
      safety_note: safetyNote,
      recommend: typeof payload.recommend === "boolean" ? payload.recommend : null,
      visit_date: visitDate,
      updated_at: new Date().toISOString()
    },
    { onConflict: "destination_id,user_id" }
  );

  if (error) return NextResponse.json({ ok: false, message: "提交失败，请稍后再试。" }, { status: 500 });

  return NextResponse.json({ ok: true, message: "已提交，感谢你的真实体验。" });
}
