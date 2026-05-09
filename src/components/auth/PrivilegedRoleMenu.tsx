import Link from "next/link";
import { PrivilegedRoleMenuClient } from "@/components/auth/PrivilegedRoleMenuClient";
import { resolveBaseRole } from "@/lib/auth/effective-role";
import {
  getActiveRoleCookie,
  getAllowedActiveRoles,
  roleLabels,
} from "@/lib/auth/role-session";
import type { Role } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export async function PrivilegedRoleMenu({ align = "down" }: { align?: "down" | "up" } = {}) {
  const baseRole = await getBaseRole();
  if (baseRole !== "admin") return null;

  const activeRole = (await getActiveRoleCookie()) || baseRole;
  const roles = getAllowedActiveRoles(baseRole);

  return (
    <PrivilegedRoleMenuClient align={align}>
      <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-brand-text-muted">
        Navegar como
      </p>
      <div className="grid gap-1">
        {roles.map((role) => (
          <Link
            key={role}
            href={getRoleHref(role as Role)}
            className={`block min-h-10 w-full rounded-xl px-3 py-2 text-left text-sm transition ${
              activeRole === role
                ? "bg-brand-500/15 text-brand-300"
                : "text-brand-text-base hover:bg-white/[0.05] hover:text-white"
            }`}
          >
            {roleLabels[role as Role]}
          </Link>
        ))}
      </div>
    </PrivilegedRoleMenuClient>
  );
}

async function getBaseRole(): Promise<Role | null> {
  if (process.env.ADMIN_DISABLE_AUTH === "1") return "admin";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const resolved = await resolveBaseRole(supabase, user);
  return resolved;
}

function getRoleHref(role: Role) {
  return `/auth/switch-role/${role}`;
}
