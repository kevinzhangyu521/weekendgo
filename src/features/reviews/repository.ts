import { createClient } from "@/lib/supabase/server";
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

export async function getDestinationReviews(destinationId: string, limit = 8) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("destination_reviews")
    .select("id,destination_id,user_id,rating,content,visit_date,created_at")
    .eq("destination_id", destinationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as ReviewRow[]).map((row) => normalize(row, user?.id));
}

export async function getMyDestinationReview(destinationId: string) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("destination_reviews")
    .select("id,destination_id,user_id,rating,content,visit_date,created_at")
    .eq("destination_id", destinationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return null;
  return normalize(data as ReviewRow, user.id);
}

export async function getDestinationReviewsForUser(destinationId: string, userId?: string, limit = 8) {
  const supabase = await createClient();
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
