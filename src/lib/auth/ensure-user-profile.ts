import type { SupabaseClient, User } from "@supabase/supabase-js";
import { normalizeRole } from "./roles";

type EnsurePublicUserProfileResult =
  | { success: true }
  | { success: false; error: string };

function sanitizeHandleCandidate(value: string) {
  const cleaned = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  return cleaned.slice(0, 40) || "user";
}

function isDuplicateHandleError(message?: string) {
  if (!message) return false;
  return (
    message.includes("users_handle_unique") ||
    message.includes("duplicate key value") ||
    message.includes("handle")
  );
}

function isLegacyEditorEnumError(message?: string) {
  if (!message) return false;
  return /invalid input value for enum .*user_role/i.test(message);
}

async function resolveAvailableHandle(
  supabase: SupabaseClient,
  userId: string,
  preferredHandle: string
) {
  const normalized = sanitizeHandleCandidate(preferredHandle);
  const fallbackSuffix = userId.replace(/-/g, "").slice(0, 8);
  const candidates = [
    normalized,
    `${normalized.slice(0, 31)}_${fallbackSuffix}`,
    `user_${fallbackSuffix}`,
  ];

  for (const candidate of candidates) {
    const { data, error } = await supabase
      .from("users")
      .select("id")
      .eq("handle", candidate)
      .maybeSingle();

    if (error) continue;
    if (!data || data.id === userId) return candidate;
  }

  return `user_${fallbackSuffix}`;
}

async function ensureSubscriberProfileRow(
  supabase: SupabaseClient,
  userId: string,
  displayName: string,
  handle: string,
  bio: string | null,
  avatarUrl: string | null
) {
  const { error } = await supabase.from("subscriber_profiles").upsert(
    {
      user_id: userId,
      display_name: displayName,
      handle,
      bio,
      avatar_url: avatarUrl,
    },
    { onConflict: "user_id", ignoreDuplicates: true }
  );

  if (error && !/subscriber_profiles|does not exist|could not find the table|column/i.test(error.message)) {
    return { success: false, error: error.message };
  }

  return { success: true } as const;
}

async function ensureCreatorProfileIdentityRow(
  supabase: SupabaseClient,
  userId: string,
  displayName: string,
  handle: string,
  bio: string | null,
  avatarUrl: string | null
) {
  const baseInsert = await supabase.from("creator_profiles").upsert(
    {
      user_id: userId,
      public_display_name: displayName,
      public_handle: handle,
      public_bio: bio,
      public_avatar_url: avatarUrl,
    },
    { onConflict: "user_id", ignoreDuplicates: true }
  );

  if (
    baseInsert.error &&
    /public_display_name|public_handle|public_bio|public_avatar_url|column/i.test(baseInsert.error.message)
  ) {
    const fallback = await supabase.from("creator_profiles").upsert(
      { user_id: userId },
      { onConflict: "user_id", ignoreDuplicates: true }
    );
    if (fallback.error && !/duplicate key/i.test(fallback.error.message)) {
      return { success: false, error: fallback.error.message };
    }
    return { success: true } as const;
  }

  if (baseInsert.error && !/duplicate key/i.test(baseInsert.error.message)) {
    return { success: false, error: baseInsert.error.message };
  }

  return { success: true } as const;
}

export async function ensurePublicUserProfile(
  supabase: SupabaseClient,
  user: User
): Promise<EnsurePublicUserProfileResult> {
  const { data: existingProfile, error: existingProfileError } = await supabase
    .from("users")
    .select("id, role, display_name, handle, bio, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (!existingProfileError && existingProfile?.id) {
    const existingDisplayName =
      typeof existingProfile.display_name === "string" && existingProfile.display_name.trim()
        ? existingProfile.display_name
        : "Usuario";
    const existingHandle =
      typeof existingProfile.handle === "string" && existingProfile.handle.trim()
        ? sanitizeHandleCandidate(existingProfile.handle)
        : await resolveAvailableHandle(supabase, user.id, user.email?.split("@")[0] || "user");
    const existingBio = typeof existingProfile.bio === "string" ? existingProfile.bio : null;
    const existingAvatar = typeof existingProfile.avatar_url === "string" ? existingProfile.avatar_url : null;
    const existingRole = normalizeRole(existingProfile.role);

    const subscriberSync = await ensureSubscriberProfileRow(
      supabase,
      user.id,
      existingDisplayName,
      existingHandle,
      existingBio,
      existingAvatar
    );
    if (!subscriberSync.success) return subscriberSync;

    if (existingRole === "creator") {
      const creatorSync = await ensureCreatorProfileIdentityRow(
        supabase,
        user.id,
        existingDisplayName,
        existingHandle,
        existingBio,
        existingAvatar
      );
      if (!creatorSync.success) return creatorSync;
    }

    return { success: true };
  }

  const email = (user.email || `${user.id}@fantasyia.local`).toLowerCase();
  const displayName =
    (typeof user.user_metadata?.display_name === "string"
      ? user.user_metadata.display_name
      : null) ||
    (email.split("@")[0] || "Usuario");
  const preferredHandle =
    (typeof user.user_metadata?.handle === "string"
      ? user.user_metadata.handle
      : null) ||
    email.split("@")[0] ||
    "user";
  const role = normalizeRole(user.user_metadata?.role);
  const baseRole = role === "editor" ? "editor" : role;
  const handle = await resolveAvailableHandle(supabase, user.id, preferredHandle);
  const bio = null;
  const avatarUrl = null;

  let { error } = await supabase.from("users").upsert(
    {
      id: user.id,
      email,
      role: baseRole,
      display_name: displayName,
      handle,
    },
    { onConflict: "id" }
  );

  if (error && isLegacyEditorEnumError(error.message) && role === "editor") {
    const fallback = await supabase.from("users").upsert(
      {
        id: user.id,
        email,
        role: "writer",
        display_name: displayName,
        handle,
      },
      { onConflict: "id" }
    );
    error = fallback.error;
  }

  if (error && isDuplicateHandleError(error.message)) {
    const fallbackHandle = await resolveAvailableHandle(
      supabase,
      user.id,
      `${preferredHandle}_${user.id.slice(0, 8)}`
    );

    const fallbackInsert = await supabase.from("users").upsert(
      {
        id: user.id,
        email,
        role: baseRole,
        display_name: displayName,
        handle: fallbackHandle,
      },
      { onConflict: "id" }
    );

    error = fallbackInsert.error;

    if (error && isLegacyEditorEnumError(error.message) && role === "editor") {
      const fallbackLegacy = await supabase.from("users").upsert(
        {
          id: user.id,
          email,
          role: "writer",
          display_name: displayName,
          handle: fallbackHandle,
        },
        { onConflict: "id" }
      );
      error = fallbackLegacy.error;
    }
  }

  if (error) {
    return { success: false, error: error.message };
  }

  const subscriberSync = await ensureSubscriberProfileRow(
    supabase,
    user.id,
    displayName,
    handle,
    bio,
    avatarUrl
  );
  if (!subscriberSync.success) return subscriberSync;

  if (role === "creator") {
    const creatorSync = await ensureCreatorProfileIdentityRow(
      supabase,
      user.id,
      displayName,
      handle,
      bio,
      avatarUrl
    );
    if (!creatorSync.success) return creatorSync;
  }

  return { success: true };
}
