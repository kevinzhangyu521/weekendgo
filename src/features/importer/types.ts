export type ImportRowError = {
  file: "spots" | "facilities" | "photos";
  row: number;
  message: string;
};

export type SpotCsvRow = {
  external_id: string;
  name: string;
  name_zh?: string;
  province?: string;
  province_zh?: string;
  city: string;
  city_zh?: string;
  lat: string;
  lng: string;
  scenario: string;
  difficulty: string;
  safety: string;
  distance_km?: string;
  description?: string;
  description_zh?: string;
};

export type FacilityCsvRow = {
  spot_external_id: string;
  facility_code: string;
  facility_name?: string;
  facility_name_zh?: string;
};

export type PhotoCsvRow = {
  spot_external_id: string;
  url: string;
  caption?: string;
  caption_zh?: string;
  sort_order?: string;
  is_cover?: string;
};

export type ImportValidateResult = {
  ok: boolean;
  errors: ImportRowError[];
  counts: {
    spots: number;
    facilities: number;
    photos: number;
  };
};

export type ImportExecuteResult = ImportValidateResult & {
  inserted: {
    spots: number;
    facilities: number;
    spotFacilities: number;
    photos: number;
  };
};
