import type { DestinationFilters, DestinationItem, Difficulty, Scenario } from "./types";

function isScenario(value: string): value is Scenario {
  return value === "camping" || value === "creek" || value === "hiking" || value === "picnic";
}

function isDifficulty(value: string): value is Difficulty {
  return value === "easy" || value === "moderate" || value === "hard";
}

export function parseFilters(
  searchParams: Record<string, string | string[] | undefined>
): DestinationFilters {
  const scenarioRaw = String(searchParams.scenario ?? "all");
  const difficultyRaw = String(searchParams.difficulty ?? "all");
  const maxDistanceRaw = Number(searchParams.maxDistance ?? 80);
  const needParking = String(searchParams.needParking ?? "false") === "true";
  const needToilet = String(searchParams.needToilet ?? "false") === "true";

  return {
    scenario: isScenario(scenarioRaw) ? scenarioRaw : "all",
    difficulty: isDifficulty(difficultyRaw) ? difficultyRaw : "all",
    maxDistanceKm: Number.isFinite(maxDistanceRaw) ? maxDistanceRaw : 80,
    needParking,
    needToilet
  };
}

export function filterDestinations(items: DestinationItem[], filters: DestinationFilters): DestinationItem[] {
  return items.filter((item) => {
    if (filters.scenario !== "all" && item.scenario !== filters.scenario) {
      return false;
    }
    if (filters.difficulty !== "all" && item.difficulty !== filters.difficulty) {
      return false;
    }
    if (item.distanceKm > filters.maxDistanceKm) {
      return false;
    }
    if (filters.needParking && !item.hasParking) {
      return false;
    }
    if (filters.needToilet && !item.hasToilet) {
      return false;
    }
    return true;
  });
}
