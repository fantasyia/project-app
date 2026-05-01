/**
 * Edge-safe base role resolution.
 * This module avoids importing `cookies()` from `next/headers` so it can
 * be used safely in Next.js Middleware (Edge Runtime on Vercel).
 */
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { normalizeRole, type Role } from "./roles";

type UserRoleRow = {
  role: string | null;
};

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
