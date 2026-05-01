import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { ensurePublicUserProfile } from "./ensure-user-profile";
import { resolveBaseRole, resolveEffectiveRole } from "./effective-role";
import { Role, hasAccessTo } from "./roles";

/**
 * Usado nas Server Actions para garantir autorização no DB
 */
export async function requireAuth() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Em server actions ou middleware isso pode estar num contexto inválido pra set
          }
        },
      },
    }
  );

  let user: User | { id: string; user_metadata: { role: string } } | null = null;

  if (process.env.ADMIN_DISABLE_AUTH === "1") {
    user = {
      id: "admin-bypass-id",
      user_metadata: { role: "admin" }
    };
  } else {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw new Error("Unauthorized");
    }
    user = data.user;

    const profileSync = await ensurePublicUserProfile(supabase, data.user);
    if (!profileSync.success) {
      console.error("Erro ao sincronizar perfil em requireAuth:", profileSync.error);
    }
  }

  const role = await resolveEffectiveRole(supabase, user);

  return { user, role, supabase };
}

/**
 * Usado nas Server Actions para travar papéis específicos
 */
export async function requireRole(requiredRole: Role) {
  const session = await requireAuth();
  
  if (!hasAccessTo(session.role, requiredRole)) {
    throw new Error("Forbidden: Insufficient privileges");
  }
  
  return session;
}

export async function requireAnyRole(allowedRoles: Role[]) {
  const session = await requireAuth();

  if (!allowedRoles.includes(session.role)) {
    throw new Error("Forbidden: Insufficient privileges");
  }

  return session;
}

export async function requireEditorialRole() {
  const session = await requireAuth();
  const baseRole = await resolveBaseRole(session.supabase, session.user);

  if (
    session.role !== "editor" &&
    session.role !== "admin" &&
    baseRole !== "editor" &&
    baseRole !== "admin"
  ) {
    throw new Error("Forbidden: Insufficient privileges");
  }

  return session;
}
