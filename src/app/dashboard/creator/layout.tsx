import Link from "next/link";
import type { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { CreatorNav } from "./creator-nav";
import { RoleSwitcher } from "@/components/auth/RoleSwitcher";

export default function CreatorLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen justify-center bg-black text-brand-text">
      <div className="app-shell flex flex-col md:border-x md:border-white/[0.04]">
        <header className="sticky top-0 z-50 flex items-center justify-between border-b border-white/[0.06] bg-black/90 px-4 py-3 backdrop-blur-md">
          <div>
            <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-brand-text-muted">Studio</p>
            <Link
              href="/dashboard/creator/studio"
              className="text-lg font-semibold tracking-tight text-white"
            >
              Fantasy<span className="text-brand-500">ia</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <RoleSwitcher />
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
              >
                <LogOut size={18} />
              </button>
            </form>
          </div>
        </header>

        <div className="border-b border-white/[0.06] px-4 py-2">
          <CreatorNav />
        </div>

        <main className="flex-1 px-4 pb-8 pt-4">{children}</main>
      </div>
    </div>
  );
}
