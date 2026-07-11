import type { FamilyExperienceApplication, FamilyExperienceApplicationStatus } from "./types";

export type FamilyExperienceApplicationRow = {
  id: string;
  application_no: string;
  user_id: string | null;
  user_email: string | null;
  user_name: string | null;
  user_role: string | null;
  parent_name: string;
  contact: string;
  city: string;
  children_age: string | null;
  preferred_scenarios: string[] | null;
  available_time: string | null;
  family_size: number | null;
  message: string | null;
  source_page_url: string | null;
  device_type: string | null;
  user_agent: string | null;
  status: FamilyExperienceApplicationStatus;
  admin_note: string | null;
  admin_reply: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  status_changed_at: string;
  created_at: string;
  updated_at: string;
};

export const familyExperienceSelectFields =
  "id,application_no,user_id,user_email,user_name,user_role,parent_name,contact,city,children_age,preferred_scenarios,available_time,family_size,message,source_page_url,device_type,user_agent,status,admin_note,admin_reply,reviewed_by,reviewed_at,status_changed_at,created_at,updated_at";

export function normalizeFamilyExperienceApplication(row: FamilyExperienceApplicationRow): FamilyExperienceApplication {
  return {
    id: row.id,
    applicationNo: row.application_no,
    userId: row.user_id,
    userEmail: row.user_email,
    userName: row.user_name,
    userRole: row.user_role ?? "guest",
    parentName: row.parent_name,
    contact: row.contact,
    city: row.city,
    childrenAge: row.children_age,
    preferredScenarios: row.preferred_scenarios ?? [],
    availableTime: row.available_time,
    familySize: row.family_size,
    message: row.message,
    sourcePageUrl: row.source_page_url,
    deviceType: row.device_type,
    userAgent: row.user_agent,
    status: row.status,
    adminNote: row.admin_note,
    adminReply: row.admin_reply,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    statusChangedAt: row.status_changed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
