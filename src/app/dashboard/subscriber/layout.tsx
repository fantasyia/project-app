import Link from "next/link";
import { MessageCircle, Bell } from "lucide-react";
import { BottomNav } from "@/components/ui/BottomNav";
import { RoleSwitcher } from "@/components/auth/RoleSwitcher";

export default function SubscriberLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen justify-center bg-black text-brand-text">
      <div className="app-shell flex flex-col md:border-x md:border-white/[0.04]">
        <header className="sticky top-0 z-50 flex items-center justify-between border-b border-white/[0.06] bg-black/90 px-4 py-3 backdrop-blur-md">
          <h1 className="text-xl font-semibold tracking-tight text-white">
            Fantasy<span className="text-brand-500">ia</span>
          </h1>
          <div className="flex items-center gap-1">
            <RoleSwitcher />
            <Link
              href="/dashboard/user/messages"
              className="flex h-10 w-10 items-center justify-center rounded-full text-brand-text-muted transition-colors hover:text-white"
            >
              <MessageCircle size={22} strokeWidth={1.5} />
            </Link>
            <Link
              href="/dashboard/user/notifications"
              className="flex h-10 w-10 items-center justify-center rounded-full text-brand-text-muted transition-colors hover:text-white"
            >
              <Bell size={22} strokeWidth={1.5} />
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-20 scrollbar-hide">
          {children}
        </main>

        <BottomNav />
      </div>
    </div>
  );
}
