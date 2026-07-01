import type { Scenario } from "@/features/destinations/types";
import type { UserRole } from "@/lib/auth/roles";

export type UserProfile = {
  userId: string;
  email: string;
  nickname: string;
  avatarUrl: string | null;
  bio: string;
  homeCity: string;
  kidAge: number | null;
  preferredScenarios: Scenario[];
  receiveNotifications: boolean;
  role: UserRole;
};
