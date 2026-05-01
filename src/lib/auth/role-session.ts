import { cookies } from "next/headers";
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

export async function getActiveRoleCookie() {
  const cookieStore = await cookies();
  return cookieStore.get(ACTIVE_ROLE_COOKIE)?.value || null;
}

export async function setActiveRoleCookie(role: Role) {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ROLE_COOKIE, role, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearActiveRoleCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_ROLE_COOKIE);
}
