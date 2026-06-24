export type Scenario = "camping" | "creek" | "hiking" | "picnic";
export type Difficulty = "easy" | "moderate" | "hard";
export type Safety = "low_risk" | "medium_risk" | "high_risk";

export type DestinationItem = {
  id: string;
  name: string;
  nameZh?: string | null;
  province?: string | null;
  provinceZh?: string | null;
  city: string;
  cityZh?: string | null;
  latitude: number;
  longitude: number;
  scenario: Scenario;
  distanceKm: number;
  difficulty: Difficulty;
  safety: Safety;
  rating: number;
  hasParking: boolean;
  hasToilet: boolean;
  minKidAge: number;
  image: string;
  description: string;
  descriptionZh?: string | null;
  isActive?: boolean;
  coverImage?: string | null;
  region?: string | null;
  driveTime?: string | null;
  ticketPrice?: string | null;
  parkingInfo?: string | null;
  toiletInfo?: string | null;
  suitableAge?: string | null;
  tags?: string[] | null;
  reviewCount?: number | null;
  badgeText?: string | null;
};

export type DestinationFilters = {
  scenario: Scenario | "all";
  maxDistanceKm: number;
  difficulty: Difficulty | "all";
  needParking: boolean;
  needToilet: boolean;
  query?: string;
  city?: string;
};
