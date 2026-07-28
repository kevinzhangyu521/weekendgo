export type FamilyDestinationExperienceStatus = "pending" | "approved" | "rejected";

export type FamilyDestinationExperienceChildAgeGroup = "0-3" | "3-6" | "6-12" | "12+";

export type FamilyDestinationExperience = {
  id: string;
  destinationId: string;
  userId: string;
  childAgeGroup: FamilyDestinationExperienceChildAgeGroup;
  visitedAt: string | null;
  recommendation: string;
  tip: string;
  status: FamilyDestinationExperienceStatus;
  createdAt: string;
  updatedAt: string;
  destinationName?: string | null;
  destinationNameZh?: string | null;
  userEmail?: string | null;
  userName?: string | null;
};

export const familyDestinationExperienceStatusOptions: FamilyDestinationExperienceStatus[] = ["pending", "approved", "rejected"];

export const familyDestinationExperienceStatusLabels: Record<FamilyDestinationExperienceStatus, string> = {
  pending: "待审核",
  approved: "已通过",
  rejected: "未通过"
};

export const familyDestinationExperienceAgeLabels: Record<FamilyDestinationExperienceChildAgeGroup, string> = {
  "0-3": "0-3岁",
  "3-6": "3-6岁",
  "6-12": "6-12岁",
  "12+": "12岁+"
};
