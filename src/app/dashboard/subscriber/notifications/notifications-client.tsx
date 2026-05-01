"use client";

import { useEffect, useMemo, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import {
  CheckCircle,
  DollarSign,
  Heart,
  Info,
  MessageSquare,
  Sparkles,
  Unlock,
  UserPlus,
  XCircle,
} from "lucide-react";
import { markAllAsRead, type AppNotification } from "@/lib/actions/notifications";
import { createClient } from "@/lib/supabase/client";

function sortNotifications(notifications: AppNotification[]) {
  return [...notifications].sort(
    (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
  );
}

export function NotificationsClient({ initialData }: { initialData: AppNotification[] }) {
  const [notifications, setNotifications] = useState(() => sortNotifications(initialData));

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.is_read).length,
    [notifications]
  );

  useEffect(() => {
    setNotifications(sortNotifications(initialData));
  }, [initialData]);

  useEffect(() => {
    const initialUnreadIds = initialData
      .filter((notification) => !notification.is_read)
      .map((notification) => notification.id);

    if (initialUnreadIds.length === 0) return;

    markAllAsRead().then(() => {
      setNotifications((prev) => prev.map((notification) => ({ ...notification, is_read: true })));
    });
  }, [initialData]);

  useEffect(() => {
    const supabase = createClient();
    let channelRef: RealtimeChannel | null = null;
    let isMounted = true;

    async function subscribe() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !isMounted) return;

      channelRef = supabase
        .channel(`subscriber-notifications-list-${user.id}-${crypto.randomUUID()}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (!isMounted) return;
            const incomingNotification = payload.new as AppNotification;
            setNotifications((prev) => {
              if (prev.some((notification) => notification.id === incomingNotification.id)) return prev;
              return sortNotifications([incomingNotification, ...prev]);
            });
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
          (payload) => {
            if (!isMounted) return;
            const nextNotification = payload.new as AppNotification;
            setNotifications((prev) =>
              sortNotifications(
                prev.map((notification) =>
                  notification.id === nextNotification.id ? nextNotification : notification
                )
              )
            );
          }
        )
        .subscribe();
    }

    subscribe();

    return () => {
      isMounted = false;
      if (channelRef) void supabase.removeChannel(channelRef);
    };
  }, []);

  if (notifications.length === 0) {
    return (
      <div className="px-5 py-16 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
          <BellIcon />
        </div>
        <h2 className="text-lg text-white">Nenhuma notificacao</h2>
        <p className="mt-2 text-sm leading-6 text-brand-text-muted">
          Voce esta atualizado. Novas mensagens, likes e eventos financeiros aparecem aqui.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 border-b border-white/8 px-5 py-5">
        <div className="rounded-2xl border border-brand-500/20 bg-brand-500/10 p-4">
          <p className="text-[10px] uppercase tracking-[0.28em] text-brand-300">Nao lidas</p>
          <p className="mt-2 text-2xl font-light text-white">{unreadCount}</p>
        </div>
        <div className="rounded-2xl border border-white/8 bg-black/25 p-4">
          <p className="text-[10px] uppercase tracking-[0.28em] text-brand-text-muted">Total</p>
          <p className="mt-2 text-2xl font-light text-white">{notifications.length}</p>
        </div>
      </div>

      <div className="divide-y divide-white/6">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex gap-4 px-5 py-4 transition ${
              notification.is_read ? "opacity-75" : "bg-brand-500/[0.05]"
            }`}
          >
            <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03]">
              {getIcon(notification.type)}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-brand-text-muted">
                    {notification.is_read ? "Lida" : "Nova"}
                  </p>
                  <h3 className="mt-1 text-sm text-white">{notification.title}</h3>
                </div>
                {!notification.is_read && <div className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-brand-500" />}
              </div>

              {notification.body && <p className="mt-2 text-sm leading-6 text-brand-text-muted">{notification.body}</p>}

              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-[10px] uppercase tracking-[0.22em] text-brand-text-muted/70">
                  {new Date(notification.created_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>

                {!notification.is_read && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-brand-500/20 bg-brand-500/10 px-2.5 py-1 text-[9px] uppercase tracking-[0.24em] text-brand-300">
                    <Sparkles size={10} />
                    Agora
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getIcon(type: string) {
  switch (type) {
    case "new_message":
      return <MessageSquare size={16} className="text-sky-300" />;
    case "post_liked":
      return <Heart size={16} className="text-rose-300" />;
    case "new_follower":
      return <UserPlus size={16} className="text-brand-300" />;
    case "new_subscription":
      return <DollarSign size={16} className="text-emerald-300" />;
    case "ppv_unlocked":
      return <Unlock size={16} className="text-amber-300" />;
    case "kyc_approved":
      return <CheckCircle size={16} className="text-emerald-300" />;
    case "kyc_rejected":
      return <XCircle size={16} className="text-rose-300" />;
    default:
      return <Info size={16} className="text-brand-text-muted" />;
  }
}

function BellIcon() {
  return (
    <svg
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-brand-text-muted"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
