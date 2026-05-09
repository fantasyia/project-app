import { getNotificationPreferences, getNotifications } from "@/lib/actions/notifications";
import { NotificationsClient } from "@/app/dashboard/subscriber/notifications/notifications-client";
import { BackButton } from "@/components/navigation/BackButton";
import { NotificationPreferencesForm } from "@/components/ui/NotificationPreferencesForm";

export const metadata = { title: "Notificacoes | Creator Fantasyia" };

export default async function CreatorNotificationsPage() {
  const notifications = await getNotifications();
  const preferences = await getNotificationPreferences();

  return (
    <div className="space-y-4 pb-20">
      <BackButton fallbackHref="/dashboard/creator/studio" label="Voltar" />
      <h1 className="text-xl font-semibold text-white">Notificacoes</h1>
      <NotificationPreferencesForm preferences={preferences} />
      <NotificationsClient initialData={notifications} />
    </div>
  );
}
