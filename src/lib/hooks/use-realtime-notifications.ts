"use client";

import { useEffect, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

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

export function useRealtimeNotifications(initialCount: number = 0) {
  const [unreadCount, setUnreadCount] = useState(initialCount);

  useEffect(() => {
    const supabase = createClient();

    async function syncUnreadCount(userId: string) {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_read", false);

      if (count !== null) setUnreadCount(count);
    }

    const getUserAndSubscribe = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await syncUnreadCount(user.id);

      const channel = supabase
        .channel(`notifications-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          async (payload) => {
            if (!(payload.new as AppNotification).is_read) {
              setUnreadCount((prev) => prev + 1);
              return;
            }

            await syncUnreadCount(user.id);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          async () => {
            await syncUnreadCount(user.id);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          async () => {
            await syncUnreadCount(user.id);
          }
        )
        .subscribe();
      return channel;
    };

    let channelRef: RealtimeChannel | null = null;
    getUserAndSubscribe().then((channel) => {
      channelRef = channel ?? null;
    });

    return () => {
      if (channelRef) supabase.removeChannel(channelRef);
    };
  }, []);

  return { unreadCount, setUnreadCount };
}
