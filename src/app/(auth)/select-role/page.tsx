import { redirect } from "next/navigation";
import Link from "next/link";
import { resolveBaseRole } from "@/lib/auth/effective-role";
import { getAllowedActiveRoles, roleLabels } from "@/lib/auth/role-session";
import type { Role } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Escolher area | Fantasyia" };

export default async function SelectRolePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const baseRole = await resolveBaseRole(supabase, user);
  const roles = getAllowedActiveRoles(baseRole);
  if (roles.length <= 1) redirect("/dashboard/user/feed");

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-brand-500/20 bg-brand-500/10 p-5 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-brand-300">
          Perfil de sessao
        </p>
        <h1 className="mt-3 text-3xl font-thin tracking-[-0.05em] text-white">
          Quer logar como?
        </h1>
        <p className="mt-3 text-sm leading-6 text-brand-text-muted">
          Escolha uma area ativa. Cada area continua isolada e com permissoes proprias.
        </p>
      </div>

      <div className="grid gap-3">
        {roles.map((role) => (
          <Link
            key={role}
            href={`/auth/switch-role/${role}`}
            className="w-full rounded-[24px] border border-white/10 bg-white/[0.04] px-5 py-4 text-left text-white transition hover:border-brand-500/30 hover:bg-brand-500/10"
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-brand-text-muted">
              Navegar como
            </span>
            <span className="mt-1 block text-xl font-semibold">{roleLabels[role as Role]}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
