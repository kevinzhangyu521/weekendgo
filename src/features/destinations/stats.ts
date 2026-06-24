import { createPublicClient } from "@/lib/supabase/public";

export type DestinationStats = {
  favoriteCount: number;
  viewCount: number;
  shareCount: number;
};

type DestinationStatsRow = {
  destination_id: string;
  favorite_count: number | null;
  view_count: number | null;
  share_count: number | null;
};

export async function getDestinationStats(destinationIds: string[]) {
  const ids = Array.from(new Set(destinationIds.filter(Boolean)));
  const stats = new Map<string, DestinationStats>();
  if (ids.length === 0) return stats;

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("destination_stats")
    .select("destination_id,favorite_count,view_count,share_count")
    .in("destination_id", ids);

  if (error || !data) return stats;

  (data as DestinationStatsRow[]).forEach((row) => {
    stats.set(row.destination_id, {
      favoriteCount: row.favorite_count ?? 0,
      viewCount: row.view_count ?? 0,
      shareCount: row.share_count ?? 0
    });
  });

  return stats;
}
