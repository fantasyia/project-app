/**
 * Server-side role session utilities that depend on `cookies()` from
 * `next/headers`. These functions can only run in Server Components,
 * Server Actions, and Route Handlers — NOT in Middleware (Edge Runtime).
 *
 * For Edge-safe utilities (constants + pure functions), import from
 * `./role-session-edge` instead.
 */
import { cookies } from "next/headers";
import type { Role } from "./roles";

// Re-export everything from the edge-safe module so existing imports
// like `import { roleRoutes } from "@/lib/auth/role-session"` keep working
// in Server Components / Route Handlers / Server Actions.
export {
  ACTIVE_ROLE_COOKIE,
  roleRoutes,
  roleLabels,
  getAllowedActiveRoles,
  canAssumeRole,
  resolveActiveRole,
} from "./role-session-edge";

export async function getActiveRoleCookie() {
  const cookieStore = await cookies();
  return cookieStore.get("fantasyia_active_role")?.value || null;
}

export async function setActiveRoleCookie(role: Role) {
  const cookieStore = await cookies();
  cookieStore.set("fantasyia_active_role", role, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearActiveRoleCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("fantasyia_active_role");
}
