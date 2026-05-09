import Link from "next/link";
import { Bell } from "lucide-react";
import { getUnreadNotificationCount } from "@/lib/actions/notifications";

export async function NotificationBell({ href }: { href: string }) {
  const count = await getUnreadNotificationCount();

  return (
    <Link
      href={href}
      className="relative flex h-10 w-10 items-center justify-center rounded-full text-brand-text-muted transition-colors hover:text-white"
      aria-label="Notificacoes"
    >
      <Bell size={21} strokeWidth={1.5} />
      {count > 0 ? (
        <span className="absolute right-1.5 top-1.5 min-w-4 rounded-full bg-brand-500 px-1 text-center text-[9px] font-bold leading-4 text-black">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );
}
