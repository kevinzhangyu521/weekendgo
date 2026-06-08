"use client";

import Link from "next/link";
import { useState } from "react";
import type { DestinationItem } from "@/features/destinations/types";
import { getAmapNavigationUrl } from "@/lib/maps/navigation";

type Props = {
  destination: DestinationItem;
  label: string;
  className?: string;
  isSignedIn?: boolean;
  loginHref?: string;
  signedOutLabel?: string;
};

function getCurrentPosition() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("geolocation_unavailable"));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 3000,
      maximumAge: 60000
    });
  });
}

export function AmapNavigationButton({ destination, label, className = "", isSignedIn = true, loginHref = "/login", signedOutLabel = "登录后导航" }: Props) {
  const [loading, setLoading] = useState(false);

  async function openNavigation() {
    setLoading(true);

    try {
      const position = await getCurrentPosition();
      const url = getAmapNavigationUrl(destination, {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        name: "\u6211\u7684\u4f4d\u7f6e"
      });
      window.location.href = url;
    } catch {
      window.location.href = getAmapNavigationUrl(destination);
    } finally {
      setLoading(false);
    }
  }

  if (!isSignedIn) {
    return (
      <Link
        href={loginHref}
        className={`inline-flex min-h-10 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 ${className}`}
      >
        {signedOutLabel}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={openNavigation}
      disabled={loading}
      className={`inline-flex min-h-10 items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-wait disabled:opacity-70 ${className}`}
    >
      {loading ? "\u6b63\u5728\u5b9a\u4f4d..." : label}
    </button>
  );
}
