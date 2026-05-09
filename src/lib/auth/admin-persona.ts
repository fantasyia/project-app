import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Role } from "./roles";
import { createServiceClient } from "@/lib/supabase/service";

export const ACTIVE_PERSONA_COOKIE = "fantasyia_active_persona_user_id";

type PublicUserRow = {
  id: string;
  email: string;
  role: Role;
  display_name: string;
  handle: string;
  bio: string | null;
  avatar_url: string | null;
  website_url: string | null;
  created_at: string;
  updated_at: string;
};

const personaLabels: Record<Role, string> = {
  admin: "Admin",
  subscriber: "User Esmeralda",
  creator: "Creator Espelho",
  affiliate: "Afiliado Espelho",
  editor: "Blog Editor Espelho",
};

function getDbClient(fallback: SupabaseClient) {
  try {
    return createServiceClient() as unknown as SupabaseClient;
  } catch {
    return fallback;
  }
}

function roleSlug(role: Role) {
  return role === "subscriber" ? "user" : role;
}

function personaEmail(adminId: string, role: Role) {
  return `admin-${adminId.slice(0, 8)}-${roleSlug(role)}@persona.fantasyia.local`;
}

function personaHandle(adminId: string, role: Role) {
  return `admin_${adminId.slice(0, 8)}_${roleSlug(role)}`.replace(/[^a-zA-Z0-9_]/g, "_");
}

export async function ensureAdminPersona(
  supabase: SupabaseClient,
  adminUser: Pick<User, "id"> | { id: string },
  role: Role
): Promise<PublicUserRow | null> {
  if (role === "admin") return null;

  const db = getDbClient(supabase);
  const { data: existingLink } = await db
    .from("admin_role_personas")
    .select("persona_user_id")
    .eq("admin_user_id", adminUser.id)
    .eq("role", role)
    .maybeSingle();

  if (existingLink?.persona_user_id) {
    const { data: existingUser } = await db
      .from("users")
      .select("*")
      .eq("id", existingLink.persona_user_id)
      .maybeSingle();
    if (existingUser) return existingUser as PublicUserRow;
  }

  const label = personaLabels[role];
  const email = personaEmail(adminUser.id, role);
  const handle = personaHandle(adminUser.id, role);

  const { data: upsertedUser, error: userError } = await db
    .from("users")
    .upsert(
      {
        email,
        role,
        display_name: label,
        handle,
        bio: "Persona espelho criada para navegacao administrativa.",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" }
    )
    .select("*")
    .single();

  if (userError || !upsertedUser) {
    console.warn("admin persona user skipped:", userError?.message);
    return null;
  }

  await db.from("admin_role_personas").upsert(
    {
      admin_user_id: adminUser.id,
      role,
      persona_user_id: upsertedUser.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "admin_user_id,role" }
  );

  if (role === "subscriber") {
    await db.from("subscriber_profiles").upsert(
      {
        user_id: upsertedUser.id,
        display_name: label,
        handle,
      },
      { onConflict: "user_id" }
    );
  }

  if (role === "creator") {
    await db.from("creator_profiles").upsert(
      {
        user_id: upsertedUser.id,
        public_display_name: label,
        public_handle: handle,
        public_bio: "Creator espelho para testes administrativos.",
      },
      { onConflict: "user_id" }
    );
  }

  return upsertedUser as PublicUserRow;
}

export async function getPersonaById(supabase: SupabaseClient, personaUserId: string) {
  const db = getDbClient(supabase);
  const { data } = await db.from("users").select("*").eq("id", personaUserId).maybeSingle();
  return (data as PublicUserRow | null) || null;
}
