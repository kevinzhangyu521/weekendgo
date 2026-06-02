import type { FacilityCsvRow, ImportRowError, ImportValidateResult, PhotoCsvRow, SpotCsvRow } from "./types";

const SCENARIOS = new Set(["camping", "creek", "hiking", "picnic"]);
const DIFFICULTIES = new Set(["easy", "moderate", "hard"]);
const SAFETY = new Set(["low_risk", "medium_risk", "high_risk"]);

function isValidUrl(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateRows(
  spots: SpotCsvRow[],
  facilities: FacilityCsvRow[],
  photos: PhotoCsvRow[]
): ImportValidateResult {
  const errors: ImportRowError[] = [];
  const spotIds = new Set<string>();

  spots.forEach((row, index) => {
    const line = index + 2;
    if (!row.external_id) errors.push({ file: "spots", row: line, message: "external_id is required" });
    if (!row.name) errors.push({ file: "spots", row: line, message: "name is required" });
    if (!row.city) errors.push({ file: "spots", row: line, message: "city is required" });
    if (!SCENARIOS.has(row.scenario)) errors.push({ file: "spots", row: line, message: "scenario is invalid" });
    if (!DIFFICULTIES.has(row.difficulty)) errors.push({ file: "spots", row: line, message: "difficulty is invalid" });
    if (!SAFETY.has(row.safety)) errors.push({ file: "spots", row: line, message: "safety is invalid" });
    if (Number.isNaN(Number(row.lat)) || Number(row.lat) < -90 || Number(row.lat) > 90) {
      errors.push({ file: "spots", row: line, message: "lat is invalid" });
    }
    if (Number.isNaN(Number(row.lng)) || Number(row.lng) < -180 || Number(row.lng) > 180) {
      errors.push({ file: "spots", row: line, message: "lng is invalid" });
    }
    if (spotIds.has(row.external_id)) {
      errors.push({ file: "spots", row: line, message: "external_id is duplicated in spots.csv" });
    }
    spotIds.add(row.external_id);
  });

  facilities.forEach((row, index) => {
    const line = index + 2;
    if (!row.spot_external_id) errors.push({ file: "facilities", row: line, message: "spot_external_id is required" });
    if (!row.facility_code) errors.push({ file: "facilities", row: line, message: "facility_code is required" });
    if (row.spot_external_id && !spotIds.has(row.spot_external_id)) {
      errors.push({ file: "facilities", row: line, message: "spot_external_id not found in spots.csv" });
    }
  });

  photos.forEach((row, index) => {
    const line = index + 2;
    if (!row.spot_external_id) errors.push({ file: "photos", row: line, message: "spot_external_id is required" });
    if (!row.url) errors.push({ file: "photos", row: line, message: "url is required" });
    if (row.url && !isValidUrl(row.url)) errors.push({ file: "photos", row: line, message: "url is invalid" });
    if (row.spot_external_id && !spotIds.has(row.spot_external_id)) {
      errors.push({ file: "photos", row: line, message: "spot_external_id not found in spots.csv" });
    }
  });

  return {
    ok: errors.length === 0,
    errors,
    counts: { spots: spots.length, facilities: facilities.length, photos: photos.length }
  };
}
