import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { BottomNav } from "@/components/ui/BottomNav";
import { FantasyIALogo } from "@/components/ui/FantasyIALogo";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { PrivilegedRoleMenu } from "@/components/auth/PrivilegedRoleMenu";

export default function SubscriberLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh justify-center bg-black text-brand-text">
      <div className="app-shell flex flex-col md:border-x md:border-white/[0.04]">
        <header className="sticky top-0 z-50 flex items-center justify-between border-b border-white/[0.06] bg-black/90 px-4 py-3 backdrop-blur-md">
          <FantasyIALogo href="/dashboard/user/feed" className="text-xl" />
          <div className="flex items-center gap-1">
            <PrivilegedRoleMenu />
            <Link
              href="/dashboard/user/messages"
              className="flex h-10 w-10 items-center justify-center rounded-full text-brand-text-muted transition-colors hover:text-white"
            >
              <MessageCircle size={22} strokeWidth={1.5} />
            </Link>
            <NotificationBell href="/dashboard/user/notifications" />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-20 scrollbar-hide">
          {children}
        </main>

        <BottomNav />
      </div>
    </div>
  );
}
