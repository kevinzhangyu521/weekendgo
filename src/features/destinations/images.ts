import type { DestinationItem } from "./types";

export const DEFAULT_DESTINATION_IMAGE =
  "/placeholders/destination-default.svg";

export type DestinationImageSource = "supabase_storage" | "destination_photos" | "legacy_image" | "default";

export type DestinationImageInfo = {
  src: string;
  pending: boolean;
  source: DestinationImageSource;
  sourceLabel: string;
  hasCover: boolean;
  isDefault: boolean;
};

function isGenericOrUnverifiedImage(url: string) {
  if (!url.trim()) return true;
  return url.includes("images.unsplash.com");
}

function isSupabaseStorageImage(url: string) {
  return url.includes("/storage/v1/object/public/") || url.includes(".supabase.co/storage/");
}

function imageSourceLabel(source: DestinationImageSource) {
  if (source === "supabase_storage") return "图片存储";
  if (source === "destination_photos") return "图片图库";
  if (source === "legacy_image") return "兼容封面";
  return "默认占位图";
}

function cleanImageUrl(value?: string | null) {
  const url = value?.trim() ?? "";
  return url && !isGenericOrUnverifiedImage(url) ? url : "";
}

export function getDestinationImage(item: DestinationItem): DestinationImageInfo {
  const coverImage = cleanImageUrl(item.coverImage);
  const legacyImage = cleanImageUrl(item.image);

  if (coverImage && isSupabaseStorageImage(coverImage)) {
    return {
      src: coverImage,
      pending: false,
      source: "supabase_storage",
      sourceLabel: imageSourceLabel("supabase_storage"),
      hasCover: true,
      isDefault: false
    };
  }

  if (legacyImage && isSupabaseStorageImage(legacyImage)) {
    return {
      src: legacyImage,
      pending: false,
      source: "supabase_storage",
      sourceLabel: imageSourceLabel("supabase_storage"),
      hasCover: true,
      isDefault: false
    };
  }

  if (coverImage) {
    return {
      src: coverImage,
      pending: false,
      source: "destination_photos",
      sourceLabel: imageSourceLabel("destination_photos"),
      hasCover: true,
      isDefault: false
    };
  }

  if (legacyImage) {
    return {
      src: legacyImage,
      pending: false,
      source: "legacy_image",
      sourceLabel: imageSourceLabel("legacy_image"),
      hasCover: true,
      isDefault: false
    };
  }

  return {
    src: DEFAULT_DESTINATION_IMAGE,
    pending: true,
    source: "default",
    sourceLabel: imageSourceLabel("default"),
    hasCover: false,
    isDefault: true
  };
}

export function hasUsableDestinationImage(item: DestinationItem) {
  return !getDestinationImage(item).pending;
}
