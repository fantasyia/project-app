import { Menu } from "lucide-react";
import Link from "next/link";
import { resolveBaseRole } from "@/lib/auth/effective-role";
import {
  getActiveRoleCookie,
  getAllowedActiveRoles,
  roleRoutes,
  roleLabels,
} from "@/lib/auth/role-session";
import type { Role } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export async function RoleSwitcher({ align = "down" }: { align?: "down" | "up" } = {}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const baseRole = await resolveBaseRole(supabase, user);
  if (baseRole !== "admin") return null;

  const activeRole = (await getActiveRoleCookie()) || baseRole;
  const roles = getAllowedActiveRoles(baseRole);

  return (
    <details className="relative">
      <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-brand-text-muted transition hover:text-white [&::-webkit-details-marker]:hidden">
        <Menu size={16} />
      </summary>
      <div
        className={`absolute right-0 z-50 w-52 overflow-hidden rounded-2xl border border-white/10 bg-black/95 p-2 shadow-[0_24px_70px_rgba(0,0,0,0.55)] ${
          align === "up" ? "bottom-11" : "top-11"
        }`}
      >
        <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-brand-text-muted">
          Navegar como
        </p>
        {roles.map((role) => (
          <Link
            key={role}
            href={getRoleHref(role as Role)}
            className={`block w-full rounded-xl px-3 py-2 text-left text-sm transition ${
              activeRole === role
                ? "bg-brand-500/15 text-brand-300"
                : "text-brand-text-base hover:bg-white/[0.05] hover:text-white"
            }`}
          >
            {roleLabels[role as Role]}
          </Link>
        ))}
      </div>
    </details>
  );
}

function getRoleHref(role: Role) {
  if (role === "editor") return "/dashboard/blog";
  if (role === "subscriber") return "/dashboard/user/feed";
  return roleRoutes[role];
}
