import { createPublicClient } from "@/lib/supabase/public";
import type { DestinationReview } from "./types";

type ReviewRow = {
  id: string;
  destination_id: string;
  user_id: string;
  rating: number;
  content: string;
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
    visitDate: row.visit_date,
    createdAt: row.created_at,
    isMine: Boolean(userId && row.user_id === userId)
  };
}

export async function getDestinationReviewsForUser(destinationId: string, userId?: string, limit = 8) {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("destination_reviews")
    .select("id,destination_id,user_id,rating,content,visit_date,created_at")
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
