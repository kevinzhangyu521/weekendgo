"use client";

import Link from "next/link";
import { useState } from "react";
import type { DestinationItem } from "@/features/destinations/types";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { destinationToNavigationPlace, openNavigation as openMapNavigation } from "@/lib/maps/navigation";

type Props = {
  destination: DestinationItem;
  label: string;
  className?: string;
  isSignedIn?: boolean;
  loginHref?: string;
  signedOutLabel?: string;
};

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

  function openNavigation() {
    setLoading(true);
    try {
      openMapNavigation(destinationToNavigationPlace(destination));
    } catch {
      // Keep the original page usable even if the external map cannot be opened.
    } finally {
      window.setTimeout(() => setLoading(false), 800);
    }
  }

  if (!signedIn) {
    return (
      <Link
        href={loginHref}
        className={`interactive-button inline-flex h-10 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-medium text-emerald-700 hover:bg-emerald-100 ${className}`}
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
      className={`interactive-button inline-flex h-10 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-70 ${className}`}
    >
      {loading ? "\u6b63\u5728\u6253\u5f00\u5730\u56fe..." : label}
    </button>
  );
}
