import { BellRing } from "lucide-react";
import { getNotifications } from "@/lib/actions/notifications";
import { NotificationsClient } from "@/app/dashboard/subscriber/notifications/notifications-client";

export const metadata = { title: "Notificações | Creator Studio" };

export default async function CreatorNotificationsPage() {
  const notifications = await getNotifications();
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6 pb-20">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-brand-surface-low px-5 py-6">
        <div className="absolute inset-0 opacity-20 brand-gradient" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-brand-bg/90" />
        
        <div className="relative z-10 flex flex-col gap-2">
          <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-500/20 px-2.5 py-1 text-[10px] uppercase tracking-widest text-brand-300">
            <BellRing size={12} />
            Central Operacional
          </div>
          <h1 className="text-2xl font-semibold text-white">
            Alertas em <span className="brand-gradient-text">Tempo Real</span>
          </h1>
          <p className="text-sm text-brand-text-muted">
            Consolidação de mensagens, unlocks, seguidores e sinais operacionais da conta.
          </p>
        </div>
      </section>

      {/* Metrics Row */}
      <section className="flex gap-3">
        <div className="flex flex-1 flex-col justify-center rounded-xl border border-white/5 bg-brand-surface-low px-4 py-3">
          <span className="text-xl font-medium text-white">{notifications.length}</span>
          <span className="text-[10px] uppercase tracking-wider text-brand-text-muted">Total</span>
        </div>
        <div className="flex flex-1 flex-col justify-center rounded-xl border border-brand-500/10 bg-brand-500/5 px-4 py-3">
          <span className="text-xl font-medium text-brand-400">{unreadCount}</span>
          <span className="text-[10px] uppercase tracking-wider text-brand-text-muted">Não Lidas</span>
        </div>
      </section>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Notifications List Component */}
      <section className="rounded-xl border border-white/5 bg-brand-surface-low shadow-sm">
        <NotificationsClient initialData={notifications} />
      </section>
    </div>
  );
}
