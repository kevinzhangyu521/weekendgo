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

type ProfileRow = {
  user_id: string;
  nickname: string | null;
  avatar_url: string | null;
};

async function getPublicProfileNames(userIds: string[]) {
  const profiles = new Map<string, { nickname: string | null; avatarUrl: string | null }>();
  const reviewerIds = Array.from(new Set(userIds.filter(Boolean)));
  if (reviewerIds.length === 0) return profiles;

  const supabase = createPublicClient();
  const { data } = await supabase.rpc("get_public_review_profile_names", { user_ids: reviewerIds });

  (data as ProfileRow[] | null)?.forEach((profile) => {
    profiles.set(profile.user_id, {
      nickname: profile.nickname?.trim() || null,
      avatarUrl: profile.avatar_url?.trim() || null
    });
  });

  return profiles;
}

function normalize(row: ReviewRow, userId?: string, profiles = new Map<string, { nickname: string | null; avatarUrl: string | null }>()): DestinationReview {
  const profile = profiles.get(row.user_id);

  return {
    id: row.id,
    destinationId: row.destination_id,
    userId: row.user_id,
    userName: profile?.nickname ?? null,
    userAvatarUrl: profile?.avatarUrl ?? null,
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

  const rows = data as ReviewRow[];
  const profileNames = await getPublicProfileNames(rows.map((row) => row.user_id));

  const reviews = rows.map((row) => normalize(row, userId, profileNames));
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

export async function getLatestDestinationReviews(destinationIds: string[], limit = 4) {
  if (destinationIds.length === 0) return [];

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("destination_reviews")
    .select("id,destination_id,user_id,rating,content,suitable_age,parking_rating,toilet_rating,safety_note,recommend,visit_date,created_at")
    .in("destination_id", destinationIds)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  const rows = data as ReviewRow[];
  const profileNames = await getPublicProfileNames(rows.map((row) => row.user_id));
  return rows.map((row) => normalize(row, undefined, profileNames));
}
