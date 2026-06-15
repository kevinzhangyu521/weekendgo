"use client";

import Link from "next/link";
import { useState } from "react";
import type { DestinationItem } from "@/features/destinations/types";
import { useCurrentUser } from "@/lib/auth/use-current-user";
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

export function AmapNavigationButton({
  destination,
  label,
  className = "",
  isSignedIn = true,
  loginHref = "/login",
  signedOutLabel = "\u767b\u5f55\u540e\u5bfc\u822a"
}: Props) {
  const [loading, setLoading] = useState(false);
  const currentUser = useCurrentUser();
  const signedIn = currentUser.isLoading ? isSignedIn : currentUser.isAuthenticated;

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

  if (!signedIn) {
    return (
      <Link
        href={loginHref}
        className={`inline-flex h-10 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-medium text-emerald-700 hover:bg-emerald-100 ${className}`}
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
      className={`inline-flex h-10 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-medium text-white disabled:cursor-wait disabled:opacity-70 ${className}`}
    >
      {loading ? "\u6b63\u5728\u5b9a\u4f4d..." : label}
    </button>
  );
}
