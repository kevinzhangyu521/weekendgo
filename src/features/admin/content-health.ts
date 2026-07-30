import type { AdminDestination } from "@/features/admin/destinations";
import type { DestinationPhoto } from "@/features/destinations/types";

export type FamilyDestinationExperienceStatus = "pending" | "approved" | "rejected";
export type ExperienceCounts = Record<FamilyDestinationExperienceStatus, number>;

export type ContentHealthSummary = {
  contentScore: number;
  imageScore: number;
  experienceTotal: number;
  experienceCounts: ExperienceCounts;
  missingItems: string[];
  requiredIssues: string[];
  recommendedIssues: string[];
  imageCounts: {
    cover: number;
    gallery: number;
    parking: number;
    toilet: number;
    food: number;
  };
};

const emptyCounts: ExperienceCounts = {
  approved: 0,
  pending: 0,
  rejected: 0
};

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim());
}

function hasCoordinates(item: AdminDestination) {
  return item.latitude !== 0 && item.longitude !== 0;
}

function hasAge(item: AdminDestination) {
  return item.suitableAgeMin !== null || item.suitableAgeMax !== null || item.minKidAge > 0;
}

function countPhotos(photos: DestinationPhoto[]) {
  return photos.reduce(
    (counts, photo) => {
      if (photo.isCover || photo.category === "cover") counts.cover += 1;
      if (photo.category === "gallery") counts.gallery += 1;
      if (photo.category === "parking") counts.parking += 1;
      if (photo.category === "toilet") counts.toilet += 1;
      if (photo.category === "food") counts.food += 1;
      return counts;
    },
    { cover: 0, gallery: 0, parking: 0, toilet: 0, food: 0 }
  );
}

function hasCover(item: AdminDestination, photos: DestinationPhoto[]) {
  return hasText(item.coverImage) || hasText(item.image) || photos.some((photo) => photo.isCover || photo.category === "cover");
}

function calculatePercent(done: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((done / total) * 100);
}

export function calculateContentHealth(
  item: AdminDestination,
  photos: DestinationPhoto[] = item.photos ?? [],
  counts: Partial<ExperienceCounts> = {}
): ContentHealthSummary {
  const experienceCounts: ExperienceCounts = {
    ...emptyCounts,
    ...counts
  };
  const imageCounts = countPhotos(photos);
  const coverReady = hasCover(item, photos);
  const approvedExperiences = experienceCounts.approved;

  const contentChecks = [
    hasText(item.nameZh || item.name),
    hasText(item.address),
    hasCoordinates(item),
    hasText(item.editorRecommendation),
    hasText(item.familyTips),
    hasText(item.avoidPitfalls),
    hasText(item.familyBudget) || hasText(item.ticketPrice),
    hasAge(item),
    hasText(item.suggestedDuration),
    hasText(item.openingHours),
    coverReady,
    approvedExperiences > 0
  ];

  const imageChecks = [
    coverReady,
    imageCounts.gallery > 0,
    imageCounts.parking > 0,
    imageCounts.toilet > 0,
    imageCounts.food > 0
  ];

  const requiredIssues = [
    { label: "名称", missing: !hasText(item.nameZh || item.name) },
    { label: "地址", missing: !hasText(item.address) },
    { label: "坐标", missing: !hasCoordinates(item) },
    { label: "封面图", missing: !coverReady },
    { label: "推荐理由", missing: !hasText(item.editorRecommendation) },
    { label: "带娃提醒", missing: !hasText(item.familyTips) },
    { label: "避坑提醒", missing: !hasText(item.avoidPitfalls) }
  ]
    .filter((issue) => issue.missing)
    .map((issue) => issue.label);

  const recommendedIssues = [
    { label: "年龄范围", missing: !hasAge(item) },
    { label: "游玩时长", missing: !hasText(item.suggestedDuration) },
    { label: "预算/门票", missing: !hasText(item.familyBudget) && !hasText(item.ticketPrice) },
    { label: "开放时间", missing: !hasText(item.openingHours) },
    { label: "最佳游玩时间", missing: !hasText(item.bestTime) },
    { label: "家庭体验", missing: approvedExperiences === 0 },
    { label: "停车信息", missing: !hasText(item.parkingDetail) && imageCounts.parking === 0 },
    { label: "卫生间信息", missing: !hasText(item.toiletDetail) && imageCounts.toilet === 0 },
    { label: "图库", missing: imageCounts.gallery === 0 }
  ]
    .filter((issue) => issue.missing)
    .map((issue) => issue.label);

  return {
    contentScore: calculatePercent(contentChecks.filter(Boolean).length, contentChecks.length),
    imageScore: calculatePercent(imageChecks.filter(Boolean).length, imageChecks.length),
    experienceTotal: experienceCounts.approved + experienceCounts.pending + experienceCounts.rejected,
    experienceCounts,
    missingItems: [...requiredIssues, ...recommendedIssues],
    requiredIssues,
    recommendedIssues,
    imageCounts
  };
}
