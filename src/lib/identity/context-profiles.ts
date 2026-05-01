import type { SupabaseClient } from "@supabase/supabase-js";
import { sanitizePersistedAvatarUrl } from "@/lib/media/post-media";

export type IdentityView = {
  display_name: string | null;
  handle: string | null;
  bio: string | null;
  avatar_url: string | null;
};

type CreatorIdentityRow = {
  user_id: string;
  public_display_name?: string | null;
  public_handle?: string | null;
  public_bio?: string | null;
  public_avatar_url?: string | null;
};

type SubscriberIdentityRow = {
  user_id: string;
  display_name?: string | null;
  handle?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
};

function isSchemaMissingError(message?: string) {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return (
    normalized.includes("does not exist") ||
    normalized.includes("could not find the table") ||
    normalized.includes("column") ||
    normalized.includes("relation")
  );
}

function toRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function readText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readCreatorIdentityFromMetadata(metadata: unknown): IdentityView | null {
  const creatorProfile = toRecord(toRecord(metadata).creator_profile);
  if (Object.keys(creatorProfile).length === 0) return null;

  return {
    display_name: readText(creatorProfile.display_name),
    handle: readText(creatorProfile.handle),
    bio: readText(creatorProfile.bio),
    avatar_url: sanitizePersistedAvatarUrl(readText(creatorProfile.avatar_url)),
  };
}

async function fillCreatorIdentityFromAuthMetadata(map: Map<string, IdentityView>, userIds: string[]) {
  const missingUserIds = userIds.filter((userId) => !map.has(userId));
  if (missingUserIds.length === 0 || !process.env.SUPABASE_SERVICE_ROLE_KEY) return map;

  try {
    const { createServiceClient } = await import("@/lib/supabase/service");
    const serviceClient = createServiceClient();

    await Promise.all(
      missingUserIds.map(async (userId) => {
        const { data, error } = await serviceClient.auth.admin.getUserById(userId);
        if (error) return;

        const identity = readCreatorIdentityFromMetadata(data.user?.user_metadata);
        if (identity) map.set(userId, identity);
      })
    );
  } catch {
    return map;
  }

  return map;
}

export async function getCreatorIdentityMap(
  supabase: SupabaseClient,
  userIds: string[]
): Promise<Map<string, IdentityView>> {
  const map = new Map<string, IdentityView>();
  if (userIds.length === 0) return map;

  const { data, error } = await supabase
    .from("creator_profiles")
    .select("user_id, public_display_name, public_handle, public_bio, public_avatar_url")
    .in("user_id", userIds);

  if (error) {
    if (isSchemaMissingError(error.message)) {
      return fillCreatorIdentityFromAuthMetadata(map, userIds);
    }
    return map;
  }

  ((data || []) as CreatorIdentityRow[]).forEach((row) => {
    map.set(row.user_id, {
      display_name: row.public_display_name || null,
      handle: row.public_handle || null,
      bio: row.public_bio || null,
      avatar_url: sanitizePersistedAvatarUrl(row.public_avatar_url || null),
    });
  });

  return fillCreatorIdentityFromAuthMetadata(map, userIds);
}

export async function getCreatorIdentityByUserId(
  supabase: SupabaseClient,
  userId: string
): Promise<IdentityView | null> {
  if (!userId) return null;
  const map = await getCreatorIdentityMap(supabase, [userId]);
  return map.get(userId) || null;
}

export async function getSubscriberIdentityMap(
  supabase: SupabaseClient,
  userIds: string[]
): Promise<Map<string, IdentityView>> {
  const map = new Map<string, IdentityView>();
  if (userIds.length === 0) return map;

  const { data, error } = await supabase
    .from("subscriber_profiles")
    .select("user_id, display_name, handle, bio, avatar_url")
    .in("user_id", userIds);

  if (error) {
    if (isSchemaMissingError(error.message)) return map;
    return map;
  }

  ((data || []) as SubscriberIdentityRow[]).forEach((row) => {
    map.set(row.user_id, {
      display_name: row.display_name || null,
      handle: row.handle || null,
      bio: row.bio || null,
      avatar_url: sanitizePersistedAvatarUrl(row.avatar_url || null),
    });
  });

  return map;
}

export async function getSubscriberIdentityByUserId(
  supabase: SupabaseClient,
  userId: string
): Promise<IdentityView | null> {
  if (!userId) return null;
  const map = await getSubscriberIdentityMap(supabase, [userId]);
  return map.get(userId) || null;
}
