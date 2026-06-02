import type { Scenario } from "@/features/destinations/types";

export type UserProfile = {
  userId: string;
  email: string;
  nickname: string;
  homeCity: string;
  kidAge: number | null;
  preferredScenarios: Scenario[];
  receiveNotifications: boolean;
};
