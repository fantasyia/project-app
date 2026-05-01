"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useRealtimeNotifications } from "@/lib/hooks/use-realtime-notifications";

export function NotificationBell({ href }: { href: string }) {
  const { unreadCount } = useRealtimeNotifications();

  return (
    <Link
      href={href}
      className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-brand-text-muted transition hover:border-brand-500/20 hover:text-brand-300"
    >
      <span className="sr-only">Notificacoes</span>
      {unreadCount > 0 && (
        <div className="pointer-events-none absolute inset-0 rounded-full border border-brand-500/15 shadow-[0_0_24px_rgba(0,168,107,0.12)]" />
      )}
      {unreadCount > 0 && (
        <div className="absolute right-0 top-0 flex h-5 min-w-5 -translate-y-1/4 translate-x-1/4 items-center justify-center rounded-full border border-black bg-brand-500 px-1 text-[9px] font-bold text-black shadow-[0_0_18px_rgba(0,168,107,0.28)]">
          {unreadCount > 9 ? "9+" : unreadCount}
        </div>
      )}
      <Bell size={18} strokeWidth={1.6} />
    </Link>
  );
}
