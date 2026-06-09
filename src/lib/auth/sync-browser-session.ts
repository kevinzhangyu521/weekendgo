"use client";

import { createClient } from "@/lib/supabase/client";

export async function syncBrowserSessionToServer() {
  const supabase = createClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session?.access_token || !session.refresh_token) return false;

  const response = await fetch("/auth/sync-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    cache: "no-store",
    body: JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token
    })
  });

  return response.ok;
}
