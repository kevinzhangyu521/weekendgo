"use client";

import { useState } from "react";
import type { DestinationItem } from "@/features/destinations/types";
import { getAmapNavigationUrl } from "@/lib/maps/navigation";

type Props = {
  destination: DestinationItem;
  label: string;
};

function getCurrentPosition() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("geolocation_unavailable"));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 60000
    });
  });
}

export function AmapNavigationButton({ destination, label }: Props) {
  const [loading, setLoading] = useState(false);

  async function openNavigation() {
    setLoading(true);
    const navigationWindow = window.open("about:blank", "_blank", "noopener,noreferrer");

    function openUrl(url: string) {
      if (navigationWindow) {
        navigationWindow.location.href = url;
        return;
      }
      window.location.href = url;
    }

    try {
      const position = await getCurrentPosition();
      const url = getAmapNavigationUrl(destination, {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        name: "我的位置"
      });
      openUrl(url);
    } catch {
      openUrl(getAmapNavigationUrl(destination));
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={openNavigation}
      disabled={loading}
      className="inline-flex min-h-10 items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-wait disabled:opacity-70"
    >
      {loading ? "正在定位..." : label}
    </button>
  );
}
