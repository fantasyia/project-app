/**
 * Edge-safe role session utilities.
 * This module contains ONLY pure functions and constants — no `cookies()` from
 * `next/headers` — so it can be safely imported from Next.js Middleware
 * (which runs in the Edge Runtime on Vercel).
 */
import type { Role } from "./roles";
import { normalizeRole } from "./roles";

export const ACTIVE_ROLE_COOKIE = "fantasyia_active_role";

export const roleRoutes: Record<Role, string> = {
  subscriber: "/dashboard/user/feed",
  creator: "/dashboard/creator/studio",
  affiliate: "/dashboard/affiliate/overview",
  admin: "/dashboard/admin/overview",
  editor: "/dashboard/blog",
};

export const roleLabels: Record<Role, string> = {
  subscriber: "User",
  creator: "Creator",
  affiliate: "Afiliado",
  admin: "Admin",
  editor: "Blog",
};

export function getAllowedActiveRoles(baseRole: Role): Role[] {
  if (baseRole === "subscriber") return ["subscriber"];
  if (baseRole === "admin") return ["admin", "creator", "affiliate", "editor", "subscriber"];
  return [baseRole, "subscriber"];
}

export function canAssumeRole(baseRole: Role, activeRole: Role) {
  return getAllowedActiveRoles(baseRole).includes(activeRole);
}

export function resolveActiveRole(baseRole: Role, rawActiveRole?: string | null): Role {
  const activeRole = normalizeRole(rawActiveRole);
  return canAssumeRole(baseRole, activeRole) ? activeRole : baseRole;
}
