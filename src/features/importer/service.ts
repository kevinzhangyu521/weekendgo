import { createClient } from "@/lib/supabase/server";
import { parseCsv } from "./csv";
import type {
  FacilityCsvRow,
  ImportExecuteResult,
  ImportValidateResult,
  PhotoCsvRow,
  SpotCsvRow
} from "./types";
import { validateRows } from "./validate";

type SupabaseWriter = Awaited<ReturnType<typeof createClient>>;

function toBool(v?: string) {
  return String(v ?? "").toLowerCase() === "true" || v === "1";
}

function provinceFromRow(row: SpotCsvRow) {
  return row.province || row.city;
}

function provinceZhFromRow(row: SpotCsvRow) {
  return row.province_zh || row.province || row.city_zh || row.city;
}

function buildDestinationPayload(spots: SpotCsvRow[], facilities: FacilityCsvRow[], photos: PhotoCsvRow[]) {
  const facilitiesBySpot = new Map<string, Set<string>>();
  facilities.forEach((row) => {
    if (!facilitiesBySpot.has(row.spot_external_id)) facilitiesBySpot.set(row.spot_external_id, new Set());
    facilitiesBySpot.get(row.spot_external_id)?.add(row.facility_code);
  });

  const photosBySpot = new Map<string, PhotoCsvRow[]>();
  photos.forEach((row) => {
    if (!photosBySpot.has(row.spot_external_id)) photosBySpot.set(row.spot_external_id, []);
    photosBySpot.get(row.spot_external_id)?.push(row);
  });

  return spots.map((row) => {
    const facilityCodes = facilitiesBySpot.get(row.external_id) ?? new Set<string>();
    const spotPhotos = photosBySpot.get(row.external_id) ?? [];
    const cover = spotPhotos.find((photo) => toBool(photo.is_cover)) ?? spotPhotos[0];

    return {
      external_id: row.external_id,
      name: row.name,
      name_zh: row.name_zh || null,
      province: provinceFromRow(row),
      province_zh: provinceZhFromRow(row),
      city: row.city,
      city_zh: row.city_zh || null,
      latitude: Number(row.lat),
      longitude: Number(row.lng),
      scenario: row.scenario,
      distance_km: Number(row.distance_km || "0"),
      difficulty: row.difficulty,
      safety: row.safety,
      rating: 4.8,
      has_parking: facilityCodes.has("parking"),
      has_toilet: facilityCodes.has("toilet"),
      min_kid_age: row.scenario === "creek" ? 3 : row.difficulty === "easy" ? 3 : 6,
      ticket_price: row.ticket_price || null,
      image: cover?.url || "",
      description: row.description || "",
      description_zh: row.description_zh || null,
      is_active: true,
      updated_at: new Date().toISOString()
    };
  });
}

export function parseAndValidateCsv(
  spotsRaw: string,
  facilitiesRaw: string,
  photosRaw: string
): {
  rows: { spots: SpotCsvRow[]; facilities: FacilityCsvRow[]; photos: PhotoCsvRow[] };
  result: ImportValidateResult;
} {
  const spots = parseCsv<SpotCsvRow>(spotsRaw);
  const facilities = parseCsv<FacilityCsvRow>(facilitiesRaw);
  const photos = parseCsv<PhotoCsvRow>(photosRaw);
  const result = validateRows(spots, facilities, photos);
  return { rows: { spots, facilities, photos }, result };
}

export async function executeImport(
  spots: SpotCsvRow[],
  facilities: FacilityCsvRow[],
  photos: PhotoCsvRow[],
  writer?: SupabaseWriter
): Promise<ImportExecuteResult> {
  const validation = validateRows(spots, facilities, photos);
  if (!validation.ok) {
    return {
      ...validation,
      inserted: { spots: 0, facilities: 0, spotFacilities: 0, photos: 0 }
    };
  }

  const supabase = writer ?? (await createClient());

  const spotPayload = spots.map((row) => ({
    external_id: row.external_id,
    name: row.name,
    name_zh: row.name_zh || null,
    province: provinceFromRow(row),
    province_zh: provinceZhFromRow(row),
    city: row.city,
    city_zh: row.city_zh || null,
    lat: Number(row.lat),
    lng: Number(row.lng),
    scenario: row.scenario,
    difficulty: row.difficulty,
    safety: row.safety,
    distance_km: Number(row.distance_km || "0"),
    description: row.description || "",
    description_zh: row.description_zh || null,
    updated_at: new Date().toISOString()
  }));

  const { error: spotsError } = await supabase.from("spots").upsert(spotPayload, { onConflict: "external_id" });
  if (spotsError) {
    return {
      ok: false,
      errors: [{ file: "spots", row: 0, message: `spots 写入失败：${spotsError.message}` }],
      counts: validation.counts,
      inserted: { spots: 0, facilities: 0, spotFacilities: 0, photos: 0 }
    };
  }

  const destinationPayload = buildDestinationPayload(spots, facilities, photos);
  const { error: destinationsError } = await supabase
    .from("destinations")
    .upsert(destinationPayload, { onConflict: "external_id" });
  if (destinationsError) {
    return {
      ok: false,
      errors: [{ file: "spots", row: 0, message: `目的地同步失败：${destinationsError.message}` }],
      counts: validation.counts,
      inserted: { spots: spotPayload.length, facilities: 0, spotFacilities: 0, photos: 0 }
    };
  }

  const { data: spotRows, error: spotsFetchError } = await supabase.from("spots").select("id,external_id");
  if (spotsFetchError || !spotRows) {
    return {
      ok: false,
      errors: [{ file: "spots", row: 0, message: "\u8bfb\u53d6 spots \u6570\u636e\u5931\u8d25\u3002" }],
      counts: validation.counts,
      inserted: { spots: spotPayload.length, facilities: 0, spotFacilities: 0, photos: 0 }
    };
  }
  const spotMap = new Map<string, string>(spotRows.map((r: { id: string; external_id: string }) => [r.external_id, r.id]));

  const facilityDictionary = Array.from(
    new Map(
      facilities.map((f) => [
        f.facility_code,
        {
          code: f.facility_code,
          name: f.facility_name || f.facility_code,
          name_zh: f.facility_name_zh || null
        }
      ])
    ).values()
  );

  const { error: facilitiesError } = await supabase.from("facilities").upsert(facilityDictionary, { onConflict: "code" });
  if (facilitiesError) {
    return {
      ok: false,
      errors: [{ file: "facilities", row: 0, message: "facilities \u5199\u5165\u5931\u8d25\uff0c\u8bf7\u68c0\u67e5\u8868\u6743\u9650\u548c CSV \u5185\u5bb9\u3002" }],
      counts: validation.counts,
      inserted: { spots: spotPayload.length, facilities: 0, spotFacilities: 0, photos: 0 }
    };
  }

  const { data: facilityRows, error: facilityFetchError } = await supabase.from("facilities").select("id,code");
  if (facilityFetchError || !facilityRows) {
    return {
      ok: false,
      errors: [{ file: "facilities", row: 0, message: "\u8bfb\u53d6 facilities \u6570\u636e\u5931\u8d25\u3002" }],
      counts: validation.counts,
      inserted: { spots: spotPayload.length, facilities: facilityDictionary.length, spotFacilities: 0, photos: 0 }
    };
  }
  const facilityMap = new Map<string, string>(facilityRows.map((r: { id: string; code: string }) => [r.code, r.id]));

  const spotFacilitiesPayload = facilities
    .map((row) => {
      const spotId = spotMap.get(row.spot_external_id);
      const facilityId = facilityMap.get(row.facility_code);
      if (!spotId || !facilityId) return null;
      return { spot_id: spotId, facility_id: facilityId };
    })
    .filter(Boolean) as Array<{ spot_id: string; facility_id: string }>;

  if (spotFacilitiesPayload.length > 0) {
    const { error: spotFacilityError } = await supabase
      .from("spot_facilities")
      .upsert(spotFacilitiesPayload, { onConflict: "spot_id,facility_id" });
    if (spotFacilityError) {
      return {
        ok: false,
        errors: [{ file: "facilities", row: 0, message: "\u5730\u70b9\u548c\u8bbe\u65bd\u5173\u8054\u5931\u8d25\u3002" }],
        counts: validation.counts,
        inserted: { spots: spotPayload.length, facilities: facilityDictionary.length, spotFacilities: 0, photos: 0 }
      };
    }
  }

  const photosPayload = photos
    .map((row) => {
      const spotId = spotMap.get(row.spot_external_id);
      if (!spotId) return null;
      return {
        spot_id: spotId,
        url: row.url,
        caption: row.caption || null,
        caption_zh: row.caption_zh || null,
        sort_order: Number(row.sort_order || "0"),
        is_cover: toBool(row.is_cover)
      };
    })
    .filter(Boolean) as Array<{
    spot_id: string;
    url: string;
    caption: string | null;
    caption_zh: string | null;
    sort_order: number;
    is_cover: boolean;
  }>;

  if (photosPayload.length > 0) {
    const { error: photosError } = await supabase.from("photos").upsert(photosPayload, { onConflict: "spot_id,url" });
    if (photosError) {
      return {
        ok: false,
        errors: [{ file: "photos", row: 0, message: "photos \u5199\u5165\u5931\u8d25\uff0c\u8bf7\u68c0\u67e5\u56fe\u7247 URL \u548c CSV \u5185\u5bb9\u3002" }],
        counts: validation.counts,
        inserted: {
          spots: spotPayload.length,
          facilities: facilityDictionary.length,
          spotFacilities: spotFacilitiesPayload.length,
          photos: 0
        }
      };
    }
  }

  return {
    ok: true,
    errors: [],
    counts: validation.counts,
    inserted: {
      spots: spotPayload.length,
      facilities: facilityDictionary.length,
      spotFacilities: spotFacilitiesPayload.length,
      photos: photosPayload.length
    }
  };
}
