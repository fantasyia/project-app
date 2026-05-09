import { BackButton } from "@/components/navigation/BackButton";
import { getNotificationPreferences, getNotifications } from "@/lib/actions/notifications";
import { NotificationPreferencesForm } from "@/components/ui/NotificationPreferencesForm";
import { NotificationsClient } from "./notifications-client";

export const metadata = { title: "Notificacoes | Fantasyia" };

export default async function NotificationsPage() {
  const notifications = await getNotifications();
  const preferences = await getNotificationPreferences();

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
        <BackButton fallbackHref="/dashboard/user/feed" label="Voltar" />
        <h1 className="text-base font-semibold text-white">Notificacoes</h1>
      </div>

      <div className="space-y-4">
        <NotificationPreferencesForm preferences={preferences} />
        <NotificationsClient initialData={notifications} />
      </div>
    </div>
  );
}
