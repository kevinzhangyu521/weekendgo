import type { DestinationItem } from "./types";

export const DEFAULT_DESTINATION_IMAGE =
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1400&q=80";

const VERIFIED_REAL_IMAGES: Record<string, string> = {
  "wuhan-camping-mulan-grassland":
    "https://commons.wikimedia.org/wiki/Special:FilePath/%E6%9C%A8%E5%85%B0%E8%8D%89%E5%8E%9F%E9%A3%8E%E6%99%AF%E5%8C%BA%E5%A4%A7%E9%97%A8_-_panoramio.jpg?width=1400",
  "wuhan-picnic-east-lake-greenway":
    "https://commons.wikimedia.org/wiki/Special:FilePath/Wuhan_East_Lake_01.jpg?width=1400"
};

function normalizedText(item: DestinationItem) {
  return [item.id, item.name, item.nameZh, item.city, item.cityZh].filter(Boolean).join(" ").toLowerCase();
}

function isGenericOrUnverifiedImage(url: string) {
  if (!url.trim()) return true;
  return url.includes("images.unsplash.com");
}

export function getDestinationImage(item: DestinationItem) {
  const text = normalizedText(item);

  if (VERIFIED_REAL_IMAGES[item.id]) {
    return { src: VERIFIED_REAL_IMAGES[item.id], pending: false };
  }

  if (text.includes("mulan grassland") || item.id.includes("mulan-grassland")) {
    return { src: VERIFIED_REAL_IMAGES["wuhan-camping-mulan-grassland"], pending: false };
  }

  if (text.includes("east lake") || item.id.includes("east-lake")) {
    return { src: VERIFIED_REAL_IMAGES["wuhan-picnic-east-lake-greenway"], pending: false };
  }

  if (!isGenericOrUnverifiedImage(item.image)) {
    return { src: item.image, pending: false };
  }

  return { src: DEFAULT_DESTINATION_IMAGE, pending: true };
}

export function hasUsableDestinationImage(item: DestinationItem) {
  return !getDestinationImage(item).pending;
}
