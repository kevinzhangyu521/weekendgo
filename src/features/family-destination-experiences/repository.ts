import { createPublicClient } from "@/lib/supabase/public";
import {
  familyDestinationExperienceSelectFields,
  normalizeFamilyDestinationExperience,
  type FamilyDestinationExperienceRow
} from "./mapper";

export async function getApprovedFamilyDestinationExperiences(destinationId: string, limit = 3) {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("family_destination_experiences")
    .select(familyDestinationExperienceSelectFields)
    .eq("destination_id", destinationId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as FamilyDestinationExperienceRow[]).map(normalizeFamilyDestinationExperience);
}
