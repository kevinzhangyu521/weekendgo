import type { DestinationItem } from "@/features/destinations/types";

export function getAmapNavigationUrl(destination: DestinationItem) {
  const name = encodeURIComponent(destination.name);
  return `https://uri.amap.com/navigation?to=${destination.longitude},${destination.latitude},${name}&mode=car&policy=1&src=weekendgo`;
}
