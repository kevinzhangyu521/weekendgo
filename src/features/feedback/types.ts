export type FeedbackType = "bug" | "place_error" | "feature" | "experience" | "other";
export type FeedbackStatus = "pending" | "in_progress" | "accepted" | "completed" | "rejected";

export type FeedbackItem = {
  id: string;
  feedbackNo: string | null;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  userRole: string | null;
  type: FeedbackType;
  content: string;
  contact: string | null;
  pageUrl: string | null;
  deviceType: string | null;
  userAgent: string | null;
  status: FeedbackStatus;
  adminNote: string | null;
  adminReply: string | null;
  repliedAt: string | null;
  statusChangedAt: string | null;
  wechatNotifyReserved: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export const feedbackTypeLabels: Record<FeedbackType, string> = {
  bug: "\u7a0b\u5e8f\u95ee\u9898",
  place_error: "\u5730\u70b9\u4fe1\u606f\u9519\u8bef",
  feature: "\u529f\u80fd\u5efa\u8bae",
  experience: "\u4f53\u9a8c\u95ee\u9898",
  other: "\u5176\u4ed6"
};

export const feedbackStatusLabels: Record<FeedbackStatus, string> = {
  pending: "\u5f85\u5904\u7406",
  in_progress: "\u5904\u7406\u4e2d",
  accepted: "\u5df2\u91c7\u7eb3",
  completed: "\u5df2\u5b8c\u6210",
  rejected: "\u4e0d\u91c7\u7eb3"
};

export const feedbackStatusOptions: FeedbackStatus[] = ["pending", "in_progress", "accepted", "completed", "rejected"];
