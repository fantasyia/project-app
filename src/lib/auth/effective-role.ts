/**
 * Full role resolution utilities.
 * This module uses `getActiveRoleCookie()` from `role-session` which depends
 * on `cookies()` from `next/headers`, so it can only run in Server Components,
 * Server Actions, and Route Handlers — NOT in Middleware.
 *
 * For Edge-safe base role resolution, import `resolveBaseRole` from
 * `./resolve-base-role` directly.
 */
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Role } from "./roles";
import { getActiveRoleCookie, resolveActiveRole } from "./role-session";

// Re-export resolveBaseRole so existing imports keep working
export { resolveBaseRole } from "./resolve-base-role";

export async function resolveEffectiveRole(
  supabase: SupabaseClient,
  user: Pick<User, "id" | "user_metadata">
): Promise<Role> {
  const { resolveBaseRole } = await import("./resolve-base-role");
  const baseRole = await resolveBaseRole(supabase, user);
  const activeRole = await getActiveRoleCookie();
  return resolveActiveRole(baseRole, activeRole);
}
