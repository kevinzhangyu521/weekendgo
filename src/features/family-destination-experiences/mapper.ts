import type {
  FamilyDestinationExperience,
  FamilyDestinationExperienceChildAgeGroup,
  FamilyDestinationExperienceStatus
} from "./types";

export type FamilyDestinationExperienceRow = {
  id: string;
  destination_id: string;
  user_id: string;
  child_age_group: FamilyDestinationExperienceChildAgeGroup;
  visited_at: string | null;
  recommendation: string;
  tip: string;
  status: FamilyDestinationExperienceStatus;
  created_at: string;
  updated_at: string;
  destinations?:
    | {
        name: string | null;
        name_zh: string | null;
      }
    | Array<{
    name: string | null;
    name_zh: string | null;
  }>
    | null;
};

export const familyDestinationExperienceSelectFields =
  "id,destination_id,user_id,child_age_group,visited_at,recommendation,tip,status,created_at,updated_at";

export const familyDestinationExperienceAdminSelectFields =
  "id,destination_id,user_id,child_age_group,visited_at,recommendation,tip,status,created_at,updated_at,destinations(name,name_zh)";

export function normalizeFamilyDestinationExperience(row: FamilyDestinationExperienceRow): FamilyDestinationExperience {
  const destination = Array.isArray(row.destinations) ? row.destinations[0] : row.destinations;

  return {
    id: row.id,
    destinationId: row.destination_id,
    userId: row.user_id,
    childAgeGroup: row.child_age_group,
    visitedAt: row.visited_at,
    recommendation: row.recommendation,
    tip: row.tip,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    destinationName: destination?.name ?? null,
    destinationNameZh: destination?.name_zh ?? null
  };
}
