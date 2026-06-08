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
  const query = String(searchParams.q ?? "").trim();
  const city = String(searchParams.city ?? "").trim();

  return {
    scenario: isScenario(scenarioRaw) ? scenarioRaw : "all",
    difficulty: isDifficulty(difficultyRaw) ? difficultyRaw : "all",
    maxDistanceKm: Number.isFinite(maxDistanceRaw) ? maxDistanceRaw : 80,
    needParking,
    needToilet,
    query,
    city
  };
}

export function filterDestinations(items: DestinationItem[], filters: DestinationFilters): DestinationItem[] {
  return items.filter((item) => {
    if (filters.query) {
      const query = filters.query.toLowerCase();
      const searchableText = [
        item.name,
        item.nameZh,
        item.province,
        item.provinceZh,
        item.city,
        item.cityZh,
        item.description,
        item.descriptionZh,
        item.scenario
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (!searchableText.includes(query)) {
        return false;
      }
    }
    if (filters.city) {
      const cityText = `${item.city} ${item.cityZh ?? ""} ${item.province ?? ""} ${item.provinceZh ?? ""}`;
      if (!cityText.includes(filters.city) && !cityText.toLowerCase().includes(filters.city.toLowerCase())) {
        return false;
      }
    }
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
