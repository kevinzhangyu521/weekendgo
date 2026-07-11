export type FamilyExperienceApplicationStatus = "pending" | "in_progress" | "approved" | "waitlisted" | "rejected" | "completed";

export type FamilyExperienceApplication = {
  id: string;
  applicationNo: string;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  userRole: string;
  parentName: string;
  contact: string;
  city: string;
  childrenAge: string | null;
  preferredScenarios: string[];
  availableTime: string | null;
  familySize: number | null;
  message: string | null;
  sourcePageUrl: string | null;
  deviceType: string | null;
  userAgent: string | null;
  status: FamilyExperienceApplicationStatus;
  adminNote: string | null;
  adminReply: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  statusChangedAt: string;
  createdAt: string;
  updatedAt: string;
};

export const familyExperienceStatusLabels: Record<FamilyExperienceApplicationStatus, string> = {
  pending: "待处理",
  in_progress: "沟通中",
  approved: "已入选",
  waitlisted: "候补中",
  rejected: "暂未入选",
  completed: "已完成"
};

export const familyExperienceStatusOptions: FamilyExperienceApplicationStatus[] = [
  "pending",
  "in_progress",
  "approved",
  "waitlisted",
  "rejected",
  "completed"
];

export const familyExperienceScenarioOptions = ["露营", "玩水", "公园", "亲子", "野餐", "骑行", "徒步"] as const;
