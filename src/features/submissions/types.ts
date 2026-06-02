import type { Difficulty, Safety, Scenario } from "@/features/destinations/types";

export type SpotSubmission = {
  id: string;
  userId: string;
  name: string;
  nameZh: string | null;
  city: string;
  cityZh: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  scenario: Scenario;
  difficulty: Difficulty;
  safety: Safety;
  distanceKm: number;
  minKidAge: number;
  hasParking: boolean;
  hasToilet: boolean;
  imageUrl: string | null;
  description: string;
  descriptionZh: string | null;
  status: "pending" | "approved" | "rejected";
  reviewNote: string | null;
  createdAt: string;
};
