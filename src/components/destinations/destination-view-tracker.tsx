"use client";

import { useEffect } from "react";

export function DestinationViewTracker({ destinationId }: { destinationId: string }) {
  useEffect(() => {
    const storageKey = `qimeide:viewed:${destinationId}`;
    if (sessionStorage.getItem(storageKey)) return;
    sessionStorage.setItem(storageKey, "1");

    fetch(`/api/destinations/${destinationId}/view`, {
      method: "POST",
      credentials: "include",
      cache: "no-store"
    }).catch(() => undefined);
  }, [destinationId]);

  return null;
}
