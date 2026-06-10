import { getCurrentAuthWithAdmin } from "@/lib/auth/current-user";

export async function requireAdmin() {
  return getCurrentAuthWithAdmin();
}
