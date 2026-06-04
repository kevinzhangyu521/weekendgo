import type { DestinationItem } from "@/features/destinations/types";

type NavigationOrigin = {
  latitude: number;
  longitude: number;
  name?: string;
};

function destinationName(destination: DestinationItem) {
  return destination.nameZh || destination.name;
}

function locationParam(longitude: number, latitude: number, name: string) {
  return `${longitude},${latitude},${name}`;
}

export function getAmapNavigationUrl(destination: DestinationItem, origin?: NavigationOrigin) {
  const params = new URLSearchParams({
    to: locationParam(destination.longitude, destination.latitude, destinationName(destination)),
    mode: "car",
    policy: "1",
    src: "qimeide",
    callnative: "1"
  });

  if (origin) {
    params.set("from", locationParam(origin.longitude, origin.latitude, origin.name || "\u6211\u7684\u4f4d\u7f6e"));
  }

  return `https://uri.amap.com/navigation?${params.toString()}`;
}
