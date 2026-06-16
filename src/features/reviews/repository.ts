import { createPublicClient } from "@/lib/supabase/public";
import type { DestinationReview } from "./types";

type ReviewRow = {
  id: string;
  destination_id: string;
  user_id: string;
  rating: number;
  content: string;
  suitable_age: DestinationReview["suitableAge"];
  parking_rating: DestinationReview["parkingRating"];
  toilet_rating: DestinationReview["toiletRating"];
  safety_note: string | null;
  recommend: boolean | null;
  visit_date: string | null;
  created_at: string;
};

function normalize(row: ReviewRow, userId?: string): DestinationReview {
  return {
    id: row.id,
    destinationId: row.destination_id,
    userId: row.user_id,
    rating: row.rating,
    content: row.content,
    suitableAge: row.suitable_age,
    parkingRating: row.parking_rating,
    toiletRating: row.toilet_rating,
    safetyNote: row.safety_note,
    recommend: row.recommend,
    visitDate: row.visit_date,
    createdAt: row.created_at,
    isMine: Boolean(userId && row.user_id === userId)
  };
}

export async function getDestinationReviewsForUser(destinationId: string, userId?: string, limit = 8) {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("destination_reviews")
    .select("id,destination_id,user_id,rating,content,suitable_age,parking_rating,toilet_rating,safety_note,recommend,visit_date,created_at")
    .eq("destination_id", destinationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return { reviews: [], myReview: null };

  const reviews = (data as ReviewRow[]).map((row) => normalize(row, userId));
  return {
    reviews,
    myReview: reviews.find((review) => review.isMine) ?? null
  };
}

export async function getReviewCountsForDestinations(destinationIds: string[]) {
  if (destinationIds.length === 0) return new Map<string, number>();

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("destination_reviews")
    .select("destination_id")
    .in("destination_id", destinationIds)
    .limit(2000);

  const counts = new Map<string, number>();
  if (error || !data) return counts;

  data.forEach((row) => {
    const destinationId = row.destination_id as string | null;
    if (!destinationId) return;
    counts.set(destinationId, (counts.get(destinationId) ?? 0) + 1);
  });

  return counts;
}
