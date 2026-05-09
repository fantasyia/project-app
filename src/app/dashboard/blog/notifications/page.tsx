import { getNotificationPreferences, getNotifications } from "@/lib/actions/notifications";
import { NotificationsClient } from "@/app/dashboard/subscriber/notifications/notifications-client";
import { BackButton } from "@/components/navigation/BackButton";
import { NotificationPreferencesForm } from "@/components/ui/NotificationPreferencesForm";

export const metadata = { title: "Notificacoes | Blog Fantasyia" };

export default async function BlogNotificationsPage() {
  const notifications = await getNotifications();
  const preferences = await getNotificationPreferences();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <BackButton fallbackHref="/dashboard/blog" label="Voltar" />
      <h1 className="mt-3 text-xl font-semibold text-white">Notificacoes</h1>
      <div className="mt-4">
        <NotificationPreferencesForm preferences={preferences} />
        <NotificationsClient initialData={notifications} />
      </div>
    </div>
  );
}
