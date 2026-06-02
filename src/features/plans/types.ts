import type { DestinationItem } from "@/features/destinations/types";

export type PlanSummary = {
  id: string;
  title: string;
  planDate: string;
  status: "draft" | "published" | "archived";
  isPublic: boolean;
  shareSlug: string | null;
  itemCount: number;
};

export type PlanItem = {
  id: string;
  sortOrder: number;
  destination: DestinationItem | null;
};

export type PlanDetail = {
  id: string;
  title: string;
  planDate: string;
  status: "draft" | "published" | "archived";
  isPublic: boolean;
  shareSlug: string | null;
  notes: string;
  items: PlanItem[];
};
