"use client";

import { createClient } from "@/lib/supabase/client";

function withTimeout<T>(promise: Promise<T>, timeoutMs = 8000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error("sync_timeout")), timeoutMs);
    promise
      .then((value) => {
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timer);
        reject(error);
      });
  });
}

export async function syncBrowserSessionToServer() {
  const supabase = createClient();
  const {
    data: { session }
  } = await withTimeout(supabase.auth.getSession(), 6000);

  if (!session?.access_token || !session.refresh_token) return false;

  const response = await withTimeout(
    fetch("/auth/sync-session", {
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
    }),
    8000
  );

  return response.ok;
}
