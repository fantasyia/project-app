import { getNotificationPreferences, getNotifications } from "@/lib/actions/notifications";
import { NotificationsClient } from "@/app/dashboard/subscriber/notifications/notifications-client";
import { BackButton } from "@/components/navigation/BackButton";
import { NotificationPreferencesForm } from "@/components/ui/NotificationPreferencesForm";

export const metadata = { title: "Notificacoes | Admin Fantasyia" };

export default async function AdminNotificationsPage() {
  const notifications = await getNotifications();
  const preferences = await getNotificationPreferences();

  return (
    <div className="px-4 py-5 pb-24">
      <div className="mb-4">
        <BackButton fallbackHref="/dashboard/admin/overview" label="Voltar" />
        <h1 className="mt-3 text-xl font-semibold text-white">Notificacoes</h1>
      </div>
      <div className="space-y-4">
        <NotificationPreferencesForm preferences={preferences} />
        <NotificationsClient initialData={notifications} />
      </div>
    </div>
  );
}
