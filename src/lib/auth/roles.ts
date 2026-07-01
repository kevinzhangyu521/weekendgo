export type UserRole = "user" | "admin" | "super_admin";

export const defaultUserRole: UserRole = "user";

type RoleRow = {
  role: string | null;
};

export function normalizeUserRole(value: unknown): UserRole {
  return value === "admin" || value === "super_admin" ? value : defaultUserRole;
}

export function isAdminRole(role: UserRole) {
  return role === "admin" || role === "super_admin";
}

export async function getUserRole(supabase: { from: (table: string) => unknown }, userId: string): Promise<UserRole> {
  const client = supabase as {
    from(table: "user_profiles"): {
      select(columns: string): {
        eq(column: string, value: string): {
          maybeSingle(): Promise<{ data: RoleRow | null; error: unknown }>;
        };
      };
    };
  };
  const { data, error } = await client.from("user_profiles").select("role").eq("user_id", userId).maybeSingle();
  if (error || !data) return defaultUserRole;
  return normalizeUserRole(data.role);
}
