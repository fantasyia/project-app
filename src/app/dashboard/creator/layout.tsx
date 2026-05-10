import type { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { CreatorNav } from "./creator-nav";
import { OperationalHeader } from "@/components/layouts/OperationalHeader";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { PrivilegedRoleMenu } from "@/components/auth/PrivilegedRoleMenu";

export default function CreatorLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh justify-center bg-black text-brand-text">
      <div className="app-shell flex flex-col md:border-x md:border-white/[0.04]">
        <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-black/90 backdrop-blur-md">
          <OperationalHeader
            homeHref="/dashboard/creator/studio"
            title="Creator"
            actions={
              <>
                <PrivilegedRoleMenu />
                <NotificationBell href="/dashboard/creator/notifications" />
                <form
                  action={async () => {
                    "use server";
                    const { signOut } = await import("@/lib/actions/auth");
                    await signOut();
                  }}
                >
                  <button
                    type="submit"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-brand-text-muted transition hover:text-red-400"
                    aria-label="Sair"
                  >
                    <LogOut size={18} />
                  </button>
                </form>
              </>
            }
          />
        </header>

        <div className="border-b border-white/[0.06] px-4 py-2">
          <CreatorNav />
        </div>

        <main className="flex-1 fantasyia-no-horizontal-scroll px-4 pb-8 pt-4">{children}</main>
      </div>
    </div>
  );
}
