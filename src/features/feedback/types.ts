export type FeedbackType = "bug" | "place_error" | "feature" | "experience" | "other";
export type FeedbackStatus = "pending" | "in_progress" | "resolved";

export type FeedbackItem = {
  id: string;
  userId: string | null;
  type: FeedbackType;
  content: string;
  contact: string | null;
  pageUrl: string | null;
  deviceType: string | null;
  userAgent: string | null;
  status: FeedbackStatus;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export const feedbackTypeLabels: Record<FeedbackType, string> = {
  bug: "程序问题",
  place_error: "地点信息错误",
  feature: "功能建议",
  experience: "体验问题",
  other: "其他"
};

export const feedbackStatusLabels: Record<FeedbackStatus, string> = {
  pending: "待处理",
  in_progress: "处理中",
  resolved: "已解决"
};
