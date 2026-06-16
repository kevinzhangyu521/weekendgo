import type { DestinationItem } from "@/features/destinations/types";

export type NavigationPlace = {
  name: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

function hasCoordinates(place: NavigationPlace) {
  return typeof place.latitude === "number" && Number.isFinite(place.latitude) && typeof place.longitude === "number" && Number.isFinite(place.longitude);
}

function placeQuery(place: NavigationPlace) {
  return [place.name, place.address].filter(Boolean).join(" ").trim() || place.name;
}

function encode(value: string | number) {
  return encodeURIComponent(String(value));
}

function isIOS(userAgent: string) {
  return /iPad|iPhone|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && "ontouchend" in document);
}

function isAndroid(userAgent: string) {
  return /Android/i.test(userAgent);
}

function isMobile(userAgent: string) {
  return isIOS(userAgent) || isAndroid(userAgent) || /Mobile|Tablet/i.test(userAgent);
}

export function destinationToNavigationPlace(destination: DestinationItem): NavigationPlace {
  return {
    name: destination.nameZh || destination.name,
    address: [destination.provinceZh || destination.province, destination.cityZh || destination.city].filter(Boolean).join(" "),
    latitude: destination.latitude,
    longitude: destination.longitude
  };
}

export function getAmapWebNavigationUrl(place: NavigationPlace) {
  if (hasCoordinates(place)) {
    return `https://uri.amap.com/navigation?to=${encode(place.longitude!)},${encode(place.latitude!)},${encode(place.name)}&mode=car`;
  }
  return `https://map.baidu.com/search/${encode(placeQuery(place))}`;
}

function getAmapSchemeUrl(place: NavigationPlace) {
  if (hasCoordinates(place)) {
    return `amapuri://route/plan/?dlat=${encode(place.latitude!)}&dlon=${encode(place.longitude!)}&dname=${encode(place.name)}&dev=0&t=0`;
  }
  return `amapuri://poi?sourceApplication=qimeide&keywords=${encode(placeQuery(place))}`;
}

function getBaiduSchemeUrl(place: NavigationPlace) {
  if (hasCoordinates(place)) {
    return `baidumap://map/direction?destination=latlng:${encode(place.latitude!)},${encode(place.longitude!)}|name:${encode(place.name)}&mode=driving`;
  }
  return `baidumap://map/place/search?query=${encode(placeQuery(place))}`;
}

function getAppleMapsUrl(place: NavigationPlace) {
  if (hasCoordinates(place)) {
    return `http://maps.apple.com/?daddr=${encode(place.latitude!)},${encode(place.longitude!)}&q=${encode(place.name)}`;
  }
  return `http://maps.apple.com/?q=${encode(placeQuery(place))}`;
}

function openDesktopMap(place: NavigationPlace) {
  const opened = window.open(getAmapWebNavigationUrl(place), "_blank", "noopener,noreferrer");
  if (opened) opened.opener = null;
}

function openMobileMap(place: NavigationPlace, userAgent: string) {
  const fallbackUrl = getAmapWebNavigationUrl(place);
  const urls = isIOS(userAgent)
    ? [getAppleMapsUrl(place), getAmapSchemeUrl(place), getBaiduSchemeUrl(place), fallbackUrl]
    : [getAmapSchemeUrl(place), getBaiduSchemeUrl(place), fallbackUrl];

  let index = 0;
  let stopped = false;

  const stop = () => {
    stopped = true;
  };

  window.addEventListener("pagehide", stop, { once: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
  }, { once: true });

  const tryNext = () => {
    if (stopped || index >= urls.length) return;
    window.location.href = urls[index];
    index += 1;
    if (index < urls.length) window.setTimeout(tryNext, 1200);
  };

  tryNext();
}

export function openNavigation(place: NavigationPlace) {
  const userAgent = navigator.userAgent || "";
  if (isMobile(userAgent)) {
    openMobileMap(place, userAgent);
    return;
  }
  openDesktopMap(place);
}

export function getAmapNavigationUrl(destination: DestinationItem) {
  return getAmapWebNavigationUrl(destinationToNavigationPlace(destination));
}
