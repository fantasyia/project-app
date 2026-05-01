"use server";

import { normalizeRole } from "@/lib/auth/roles";
import { createRoleInviteToken, verifyRoleInviteToken } from "@/lib/auth/role-invites";
import {
  canAssumeRole,
  clearActiveRoleCookie,
  getAllowedActiveRoles,
  roleRoutes,
  setActiveRoleCookie,
} from "@/lib/auth/role-session";
import { ensurePublicUserProfile } from "@/lib/auth/ensure-user-profile";
import { resolveBaseRole } from "@/lib/auth/effective-role";
import { requireRole } from "@/lib/auth/rbac";
import {
  getCreatorIdentityByUserId,
  getSubscriberIdentityByUserId,
} from "@/lib/identity/context-profiles";
import { sanitizePersistedAvatarUrl, sanitizePublicAssetUrl } from "@/lib/media/post-media";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const legacyRoleRoutes: Record<string, string> = {
  ...roleRoutes,
  blog: "/dashboard/blog",
  writer: "/dashboard/blog",
};

type ContextIdentity = {
  display_name: string | null;
  handle: string | null;
  bio: string | null;
  avatar_url: string | null;
};

type ContextIdentityKey = "creator_profile" | "subscriber_profile";
type MetadataUser = { id: string; user_metadata?: unknown };

function toRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function sanitizeIdentityValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getIdentityFromMetadata(metadata: unknown, key: ContextIdentityKey): ContextIdentity | null {
  const root = toRecord(metadata);
  const raw = toRecord(root[key]);
  if (Object.keys(raw).length === 0) return null;

  return {
    display_name: sanitizeIdentityValue(raw.display_name),
    handle: sanitizeIdentityValue(raw.handle),
    bio: sanitizeIdentityValue(raw.bio),
    avatar_url: sanitizePersistedAvatarUrl(sanitizeIdentityValue(raw.avatar_url)),
  };
}

function mergeIdentity<T extends { display_name: string | null; handle: string | null; bio: string | null; avatar_url: string | null }>(
  base: T,
  identity: ContextIdentity | null
) {
  if (!identity) return base;
  return {
    ...base,
    display_name: identity.display_name || base.display_name,
    handle: identity.handle || base.handle,
    bio: identity.bio ?? base.bio,
    avatar_url: sanitizePersistedAvatarUrl(identity.avatar_url) ?? sanitizePersistedAvatarUrl(base.avatar_url),
  };
}

async function updateAuthMetadata(
  supabase: Awaited<ReturnType<typeof createClient>>,
  authUser: MetadataUser,
  patch: Record<string, unknown>
) {
  const current = toRecord(authUser.user_metadata);
  const merged = { ...current, ...patch };
  const { error } = await supabase.auth.updateUser({ data: merged });
  return error;
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const displayName = formData.get("displayName") as string;
  const inviteToken = typeof formData.get("invite") === "string" ? (formData.get("invite") as string) : null;
  const invite = verifyRoleInviteToken(inviteToken);
  const role = invite?.role || "subscriber";
  const birthDate = formData.get("birthDate") as string;

  // Verificacao de idade (18+)
  if (birthDate) {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    if (age < 18) {
      return { error: "Voce precisa ter pelo menos 18 anos para se cadastrar." };
    }
  }

  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        role,
        invite_note: invite?.note || null,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Criar perfil na tabela public.users
  if (authData.user) {
    const profileSync = await ensurePublicUserProfile(supabase, authData.user);
    if (!profileSync.success) {
      console.error("Erro ao criar perfil:", profileSync.error);
    }
  }

  await clearActiveRoleCookie();
  if (getAllowedActiveRoles(role).length > 1) redirect("/select-role");
  await setActiveRoleCookie(role);
  redirect(legacyRoleRoutes[role] || "/dashboard/user/feed");
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  if (data.url) redirect(data.url);
  redirect("/login?error=google_oauth_unavailable");
}

export async function requestPasswordReset(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email) return { error: "Informe seu email para recuperar a senha." };

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const redirectTo = `${baseUrl}/auth/callback?next=/reset-password`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  if (error) return { error: error.message };
  return {
    success: true,
    message: "Se esse email existir, enviaremos um link para redefinir a senha.",
  };
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (password.length < 6) return { error: "A nova senha precisa ter pelo menos 6 caracteres." };
  if (password !== confirmPassword) return { error: "As senhas nao conferem." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  return { success: true, message: "Senha atualizada com sucesso. Voce ja pode continuar." };
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Buscar role do usuario para redirecionar
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const profileSync = await ensurePublicUserProfile(supabase, user);
    if (!profileSync.success) {
      console.error("Erro ao sincronizar perfil no login:", profileSync.error);
    }
  }
  await clearActiveRoleCookie();
  const role = user ? await resolveBaseRole(supabase, user) : "subscriber";

  if (getAllowedActiveRoles(role).length > 1) redirect("/select-role");
  await setActiveRoleCookie(role);
  redirect(legacyRoleRoutes[role] || "/dashboard/user/feed");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  await clearActiveRoleCookie();
  redirect("/login");
}

export async function switchActiveRole(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const baseRole = await resolveBaseRole(supabase, user);
  const nextRole = normalizeRole(String(formData.get("role") || ""));
  if (!canAssumeRole(baseRole, nextRole)) {
    redirect(roleRoutes[baseRole] || "/dashboard/user/feed");
  }

  await setActiveRoleCookie(nextRole);
  redirect(roleRoutes[nextRole] || "/dashboard/user/feed");
}

export async function generateRoleInviteLink(formData: FormData) {
  await requireRole("admin");

  const rawRole = String(formData.get("role") || "");
  const note = typeof formData.get("note") === "string" ? (formData.get("note") as string) : "";
  const result = createRoleInviteToken(rawRole, note);

  if (result.error || !result.token) return { error: result.error || "Falha ao gerar convite." };

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const url = new URL("/register", baseUrl);
  url.searchParams.set("invite", result.token);

  return {
    success: true,
    inviteUrl: url.toString(),
    role: result.payload.role,
    note: result.payload.note,
  };
}

export async function getCurrentUser(
  context?: "creator" | "subscriber" | "affiliate" | "editor" | "admin"
) {
  if (process.env.ADMIN_DISABLE_AUTH === "1") {
    return {
      id: "admin-bypass-id",
      email: "admin-local@development.test",
      role: "admin",
      display_name: "Administrador (Local Dev)",
      handle: "admin_local",
      bio: "Bypass de autenticacao ativado",
      avatar_url: null,
      website_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const profileSync = await ensurePublicUserProfile(supabase, user);
  if (!profileSync.success) {
    console.error("Erro ao sincronizar perfil do usuario atual:", profileSync.error);
  }

  // Buscar perfil via Supabase SDK (nao Drizzle)
  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single();

  if (!profile) {
    // Se o perfil nao existe na tabela users, retorna dados do auth
    return {
      id: user.id,
      email: user.email || "",
      role: normalizeRole(user.user_metadata?.role),
      display_name: user.user_metadata?.display_name || "Usuario",
      handle: user.email?.split("@")[0] || "user",
      bio: null,
      avatar_url: sanitizePersistedAvatarUrl(sanitizeIdentityValue(toRecord(user.user_metadata).avatar_url)),
      website_url: null,
      created_at: user.created_at,
      updated_at: user.created_at,
    };
  }

  const normalizedRole = normalizeRole(profile.role);
  const resolvedContext = context || normalizedRole;
  const baseUser = {
    ...profile,
    role: normalizedRole,
    avatar_url: sanitizePersistedAvatarUrl(profile.avatar_url),
  };
  const creatorMetadataIdentity = getIdentityFromMetadata(user.user_metadata, "creator_profile");
  const subscriberMetadataIdentity = getIdentityFromMetadata(user.user_metadata, "subscriber_profile");

  if (resolvedContext === "creator") {
    const creatorIdentity = await getCreatorIdentityByUserId(supabase, user.id);
    return mergeIdentity(baseUser, creatorIdentity || creatorMetadataIdentity);
  }

  if (resolvedContext === "subscriber") {
    const subscriberIdentity = await getSubscriberIdentityByUserId(supabase, user.id);
    return mergeIdentity(baseUser, subscriberIdentity || subscriberMetadataIdentity);
  }

  return baseUser;
}

export async function updateCreatorProfile(formData: FormData) {
  try {
    const { user, supabase } = await requireRole("creator");

    const { data: currentCreatorProfile } = await supabase
      .from("creator_profiles")
      .select("public_handle, public_avatar_url")
      .eq("user_id", user.id)
      .maybeSingle();
    const currentHandle = currentCreatorProfile?.public_handle || null;
    const currentAvatarUrl = currentCreatorProfile?.public_avatar_url || null;

    const displayName = sanitizeDisplayName(formData.get("display_name"));
    const handle = sanitizeHandle(formData.get("handle"));
    const bio = sanitizeBio(formData.get("bio"));
    const avatarUrl = await resolveAvatarUrl(supabase, user.id, formData, currentAvatarUrl, "creator");
    const { data: currentUserProfile } = await supabase
      .from("users")
      .select("display_name, handle, bio, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    if (!displayName) return { error: "Informe um nome valido para o perfil do creator." };
    if (!handle) return { error: "Informe um handle valido para o perfil do creator." };

    const upsertCreatorIdentity = await supabase
      .from("creator_profiles")
      .upsert(
        {
          user_id: user.id,
          public_display_name: displayName,
          public_handle: handle,
          public_bio: bio,
          public_avatar_url: avatarUrl,
        },
        { onConflict: "user_id" }
      );

    let error = upsertCreatorIdentity.error;
    let usedMetadataFallback = false;
    if (
      error &&
      /public_display_name|public_handle|public_bio|public_avatar_url|column/i.test(error.message)
    ) {
      const rootMetadata = toRecord(user.user_metadata);
      const subscriberMetadataIdentity =
        getIdentityFromMetadata(user.user_metadata, "subscriber_profile") || {
          display_name:
            sanitizeIdentityValue(rootMetadata.display_name) || currentUserProfile?.display_name || null,
          handle: sanitizeIdentityValue(rootMetadata.handle) || currentUserProfile?.handle || null,
          bio: sanitizeIdentityValue(rootMetadata.bio) || currentUserProfile?.bio || null,
          avatar_url:
            sanitizePersistedAvatarUrl(sanitizeIdentityValue(rootMetadata.avatar_url)) ||
            sanitizePersistedAvatarUrl(currentUserProfile?.avatar_url || null),
        };

      const metadataError = await updateAuthMetadata(supabase, user, {
        creator_profile: {
          display_name: displayName,
          handle,
          bio,
          avatar_url: avatarUrl,
        },
        subscriber_profile: subscriberMetadataIdentity,
      });

      if (metadataError) {
        return { error: metadataError.message };
      }
      usedMetadataFallback = true;
      error = null;
    }

    if (error) {
      if (isHandleConflictError(error.message)) {
        return { error: "Esse handle ja esta em uso. Escolha outro." };
      }
      return { error: error.message };
    }

    if (!usedMetadataFallback) {
      const authUpdateError = await updateAuthMetadata(supabase, user, {
        creator_profile: {
          display_name: displayName,
          handle,
          bio,
          avatar_url: avatarUrl,
        },
      });
      if (authUpdateError) {
        return { error: authUpdateError.message };
      }
    }

    revalidatePath("/dashboard/creator/profile");
    revalidatePath("/dashboard/creator/settings");
    revalidatePath("/dashboard/creator/studio");

    const previousHandle = currentHandle;
    if (previousHandle && previousHandle !== handle) {
      revalidatePath(`/${previousHandle}`);
    }
    revalidatePath(`/${handle}`);

    return { success: true };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message &&
      !/forbidden|unauthorized/i.test(error.message)
    ) {
      return { error: error.message };
    }
    return { error: "Apenas contas creator podem editar o perfil de creator." };
  }
}

export async function updateSubscriberProfile(formData: FormData) {
  try {
    const { user, supabase } = await requireRole("subscriber");
    const { data: currentProfile } = await supabase
      .from("subscriber_profiles")
      .select("display_name, handle, bio, avatar_url")
      .eq("user_id", user.id)
      .maybeSingle();
    const { data: currentUserProfile } = await supabase
      .from("users")
      .select("display_name, handle, bio, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    const displayName =
      sanitizeDisplayName(formData.get("display_name")) ||
      sanitizeDisplayName(currentProfile?.display_name || null) ||
      sanitizeDisplayName(currentUserProfile?.display_name || null);
    const handle =
      sanitizeHandle(formData.get("handle")) ||
      sanitizeHandle(currentProfile?.handle || null) ||
      sanitizeHandle(currentUserProfile?.handle || null);
    const bio = sanitizeBio(formData.get("bio"));
    const avatarUrl = await resolveAvatarUrl(
      supabase,
      user.id,
      formData,
      sanitizePersistedAvatarUrl(currentProfile?.avatar_url || currentUserProfile?.avatar_url || null),
      "subscriber"
    );

    if (!displayName) return { error: "Informe um nome valido para o perfil." };
    if (!handle) return { error: "Informe um handle valido para o perfil." };

    const upsertSubscriberIdentity = await supabase
      .from("subscriber_profiles")
      .upsert(
        {
          user_id: user.id,
          display_name: displayName,
          handle,
          bio,
          avatar_url: avatarUrl,
        },
        { onConflict: "user_id" }
      );

    let error = upsertSubscriberIdentity.error;
    let usedMetadataFallback = false;
    if (error && /subscriber_profiles|does not exist|column/i.test(error.message)) {
      const metadataError = await updateAuthMetadata(supabase, user, {
        subscriber_profile: {
          display_name: displayName,
          handle,
          bio,
          avatar_url: avatarUrl,
        },
      });
      if (metadataError) return { error: metadataError.message };
      error = null;
      usedMetadataFallback = true;
    }

    if (error) return { error: error.message };

    if (!usedMetadataFallback) {
      const authUpdateError = await updateAuthMetadata(supabase, user, {
        subscriber_profile: {
          display_name: displayName,
          handle,
          bio,
          avatar_url: avatarUrl,
        },
      });
      if (authUpdateError) return { error: authUpdateError.message };
    }

    revalidatePath("/dashboard/user/account");
    revalidatePath("/dashboard/user/account/edit");
    revalidatePath("/dashboard/user/feed");

    return { success: true };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message &&
      !/forbidden|unauthorized/i.test(error.message)
    ) {
      return { error: error.message };
    }
    return { error: "Apenas contas de usuario podem editar este perfil." };
  }
}

function sanitizeDisplayName(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized) return null;
  return normalized.slice(0, 80);
}

function sanitizeBio(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized ? normalized.slice(0, 500) : null;
}

function sanitizeHandle(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  const normalized = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (!normalized) return null;
  return normalized.slice(0, 40);
}

function isHandleConflictError(message?: string) {
  if (!message) return false;
  return (
    message.includes("users_handle_unique") ||
    message.includes("duplicate key value") ||
    message.toLowerCase().includes("handle")
  );
}

async function resolveAvatarUrl(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  formData: FormData,
  fallbackAvatarUrl: string | null,
  scope: "creator" | "subscriber"
) {
  const incomingFile = formData.get("avatar_file");
  if (!(incomingFile instanceof File) || incomingFile.size === 0) {
    const currentAvatarField = formData.get("avatar_url");
    if (typeof currentAvatarField === "string" && currentAvatarField.trim()) {
      const sanitizedCurrent = sanitizePublicAssetUrl(currentAvatarField);
      if (sanitizedCurrent) return sanitizedCurrent;
    }
    return sanitizePersistedAvatarUrl(fallbackAvatarUrl);
  }

  const extension = incomingFile.name.split(".").pop() || "jpg";
  const fileName = `avatars/${scope}/${userId}/${Date.now()}.${extension}`;
  const uploadResult = await supabase.storage.from("post-media").upload(fileName, incomingFile);
  if (uploadResult.error) {
    throw new Error(uploadResult.error.message);
  }

  const { data } = supabase.storage.from("post-media").getPublicUrl(fileName);
  return sanitizePublicAssetUrl(data.publicUrl);
}
