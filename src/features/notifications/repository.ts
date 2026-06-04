import { createClient } from "@/lib/supabase/server";

type NotificationRow = {
  id: string;
  type: "submission_approved" | "submission_rejected";
  title: string;
  body: string;
  href: string | null;
  read_at: string | null;
  created_at: string;
};

export type UserNotification = {
  id: string;
  type: NotificationRow["type"];
  title: string;
  body: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

export async function getMyNotifications(limit = 5): Promise<UserNotification[]> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("user_notifications")
    .select("id,type,title,body,href,read_at,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return (data as NotificationRow[]).map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    href: row.href,
    readAt: row.read_at,
    createdAt: row.created_at
  }));
}
