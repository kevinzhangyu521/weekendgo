import type { Scenario } from "@/features/destinations/types";

export type UserProfile = {
  userId: string;
  email: string;
  nickname: string;
  avatarUrl: string | null;
  homeCity: string;
  kidAge: number | null;
  preferredScenarios: Scenario[];
  receiveNotifications: boolean;
};
