import type { SupabaseClient, User } from "@supabase/supabase-js";
import { normalizeRole, type Role } from "./roles";
import { getActiveRoleCookie, resolveActiveRole } from "./role-session";

type UserRoleRow = {
  role: string | null;
};

export async function resolveEffectiveRole(
  supabase: SupabaseClient,
  user: Pick<User, "id" | "user_metadata">
): Promise<Role> {
  const baseRole = await resolveBaseRole(supabase, user);
  const activeRole = await getActiveRoleCookie();
  return resolveActiveRole(baseRole, activeRole);
}

export async function resolveBaseRole(
  supabase: SupabaseClient,
  user: Pick<User, "id" | "user_metadata">
): Promise<Role> {
  const { data, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!error && (data as UserRoleRow | null)?.role) {
    return normalizeRole((data as UserRoleRow).role);
  }

  return normalizeRole(user.user_metadata?.role);
}
