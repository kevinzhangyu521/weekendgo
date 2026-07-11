export type NotificationRole = "admin" | "user";

export type NotificationType =
  | "feedback_created"
  | "feedback_replied"
  | "submission_approved"
  | "submission_rejected"
  | "family_experience_application_created"
  | "family_experience_application_updated"
  | string;

export type NotificationItem = {
  id: string;
  userId: string | null;
  role: NotificationRole;
  type: NotificationType;
  title: string;
  content: string;
  relatedId: string | null;
  relatedType: string | null;
  href: string;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
};
