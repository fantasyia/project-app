"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/rbac";

export type AppNotification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
};

export type NotificationType = "messages" | "likes" | "comments" | "moderation" | "financial" | "system";
export type NotificationChannel = "in_app" | "email";

const notificationTypes: NotificationType[] = ["messages", "likes", "comments", "moderation", "financial", "system"];
const notificationChannels: NotificationChannel[] = ["in_app", "email"];

export async function getNotifications() {
  const session = await getNotificationSession();
  const supabase = session?.supabase || (await createClient());
  const user = session?.user || null;
  if (!user) return [];

  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return data || [];
}

export async function markAsRead(notificationIds: string[]) {
  const session = await getNotificationSession();
  const supabase = session?.supabase || (await createClient());
  const user = session?.user || null;
  if (!user || !notificationIds.length) return { success: false };

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .in("id", notificationIds)
    .eq("user_id", user.id);

  return { success: true };
}

export async function markAllAsRead() {
  const session = await getNotificationSession();
  const supabase = session?.supabase || (await createClient());
  const user = session?.user || null;
  if (!user) return { success: false };

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  return { success: true };
}

export async function getUnreadNotificationCount() {
  const session = await getNotificationSession();
  const supabase = session?.supabase || (await createClient());
  const user = session?.user || null;
  if (!user) return 0;

  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  return count || 0;
}

export async function getNotificationPreferences() {
  const session = await getNotificationSession();
  const supabase = session?.supabase || (await createClient());
  const user = session?.user || null;
  if (!user) return [];

  const { data } = await supabase
    .from("notification_preferences")
    .select("channel, type, enabled")
    .eq("user_id", user.id);

  const existing = new Map((data || []).map((row) => [`${row.channel}:${row.type}`, Boolean(row.enabled)]));

  return notificationChannels.flatMap((channel) =>
    notificationTypes.map((type) => ({
      channel,
      type,
      enabled: existing.get(`${channel}:${type}`) ?? true,
    }))
  );
}

export async function updateNotificationPreferences(formData: FormData) {
  const session = await getNotificationSession();
  const supabase = session?.supabase || (await createClient());
  const user = session?.user || null;
  if (!user) return { error: "Nao autenticado." };

  const rows = notificationChannels.flatMap((channel) =>
    notificationTypes.map((type) => ({
      user_id: user.id,
      channel,
      type,
      enabled: formData.get(`${channel}:${type}`) === "on",
      updated_at: new Date().toISOString(),
    }))
  );

  const { error } = await supabase
    .from("notification_preferences")
    .upsert(rows, { onConflict: "user_id,channel,type" });

  if (error) return { error: error.message };
  return { success: true };
}

export async function shouldNotify(userId: string, channel: NotificationChannel, type: NotificationType) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notification_preferences")
    .select("enabled")
    .eq("user_id", userId)
    .eq("channel", channel)
    .eq("type", type)
    .maybeSingle();

  return data?.enabled ?? true;
}

async function getNotificationSession() {
  try {
    return await requireAuth();
  } catch {
    return null;
  }
}
