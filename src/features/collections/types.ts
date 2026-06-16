export type CollectedSpotStatus = "pending" | "approved" | "rejected";

export type CollectedSpot = {
  id: string;
  sourceUrl: string;
  videoUrl: string | null;
  creatorName: string | null;
  name: string;
  city: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  recommendation: string;
  suitableAge: string | null;
  minKidAge: number;
  isFamilyFriendly: boolean;
  canCreek: boolean;
  isCamping: boolean;
  isFree: boolean;
  parkingInfo: string | null;
  safetyTips: string | null;
  tags: string[];
  status: CollectedSpotStatus;
  reviewNote: string | null;
  createdAt: string;
};
