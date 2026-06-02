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
    if (!row.external_id) errors.push({ file: "spots", row: line, message: "external_id \u4e3a\u5fc5\u586b\u9879" });
    if (!row.name) errors.push({ file: "spots", row: line, message: "name \u4e3a\u5fc5\u586b\u9879" });
    if (!row.city) errors.push({ file: "spots", row: line, message: "city \u4e3a\u5fc5\u586b\u9879" });
    if (!SCENARIOS.has(row.scenario)) errors.push({ file: "spots", row: line, message: "scenario \u503c\u65e0\u6548" });
    if (!DIFFICULTIES.has(row.difficulty)) errors.push({ file: "spots", row: line, message: "difficulty \u503c\u65e0\u6548" });
    if (!SAFETY.has(row.safety)) errors.push({ file: "spots", row: line, message: "safety \u503c\u65e0\u6548" });
    if (Number.isNaN(Number(row.lat)) || Number(row.lat) < -90 || Number(row.lat) > 90) {
      errors.push({ file: "spots", row: line, message: "lat \u7eac\u5ea6\u65e0\u6548" });
    }
    if (Number.isNaN(Number(row.lng)) || Number(row.lng) < -180 || Number(row.lng) > 180) {
      errors.push({ file: "spots", row: line, message: "lng \u7ecf\u5ea6\u65e0\u6548" });
    }
    if (spotIds.has(row.external_id)) {
      errors.push({ file: "spots", row: line, message: "external_id \u5728 spots.csv \u4e2d\u91cd\u590d" });
    }
    spotIds.add(row.external_id);
  });

  facilities.forEach((row, index) => {
    const line = index + 2;
    if (!row.spot_external_id) errors.push({ file: "facilities", row: line, message: "spot_external_id \u4e3a\u5fc5\u586b\u9879" });
    if (!row.facility_code) errors.push({ file: "facilities", row: line, message: "facility_code \u4e3a\u5fc5\u586b\u9879" });
    if (row.spot_external_id && !spotIds.has(row.spot_external_id)) {
      errors.push({ file: "facilities", row: line, message: "spot_external_id \u5728 spots.csv \u4e2d\u4e0d\u5b58\u5728" });
    }
  });

  photos.forEach((row, index) => {
    const line = index + 2;
    if (!row.spot_external_id) errors.push({ file: "photos", row: line, message: "spot_external_id \u4e3a\u5fc5\u586b\u9879" });
    if (!row.url) errors.push({ file: "photos", row: line, message: "url \u4e3a\u5fc5\u586b\u9879" });
    if (row.url && !isValidUrl(row.url)) errors.push({ file: "photos", row: line, message: "url \u683c\u5f0f\u65e0\u6548" });
    if (row.spot_external_id && !spotIds.has(row.spot_external_id)) {
      errors.push({ file: "photos", row: line, message: "spot_external_id \u5728 spots.csv \u4e2d\u4e0d\u5b58\u5728" });
    }
  });

  return {
    ok: errors.length === 0,
    errors,
    counts: { spots: spots.length, facilities: facilities.length, photos: photos.length }
  };
}
