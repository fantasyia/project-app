import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getNotifications } from "@/lib/actions/notifications";
import { NotificationsClient } from "./notifications-client";

export const metadata = { title: "Notificacoes | Fantasyia" };

export default async function NotificationsPage() {
  const notifications = await getNotifications();

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
        <Link
            href="/dashboard/user/feed"
          className="flex h-8 w-8 items-center justify-center rounded-full text-brand-text-muted transition hover:text-white"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-base font-semibold text-white">Notificações</h1>
      </div>

      <NotificationsClient initialData={notifications} />
    </div>
  );
}
