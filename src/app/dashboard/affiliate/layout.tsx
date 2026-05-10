import { Coins, LayoutDashboard, Link as LinkIcon, LogOut, Settings, Users } from "lucide-react";
import { DashboardCascadeMenu } from "@/components/layouts/DashboardCascadeMenu";
import { OperationalHeader } from "@/components/layouts/OperationalHeader";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { PrivilegedRoleMenu } from "@/components/auth/PrivilegedRoleMenu";

const affiliateLinks = [
  { href: "/dashboard/affiliate/overview", icon: <LayoutDashboard size={17} strokeWidth={1.6} />, label: "Geral" },
  { href: "/dashboard/affiliate/links", icon: <LinkIcon size={17} strokeWidth={1.6} />, label: "Links" },
  { href: "/dashboard/affiliate/commissions", icon: <Coins size={17} strokeWidth={1.6} />, label: "Comissoes" },
  { href: "/dashboard/affiliate/promoted", icon: <Users size={17} strokeWidth={1.6} />, label: "Promovidos" },
  { href: "/dashboard/affiliate/settings", icon: <Settings size={17} strokeWidth={1.6} />, label: "Ajustes" },
];

export default async function AffiliateLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh justify-center bg-[radial-gradient(circle_at_top_left,rgba(0,168,107,0.12),transparent_34%),linear-gradient(180deg,#070908_0%,#030303_100%)] text-brand-text">
      <div className="app-shell flex flex-col border-x border-white/8 bg-black/30 shadow-[0_24px_90px_rgba(0,0,0,0.42)]">
        <header className="sticky top-0 z-40 border-b border-white/8 bg-black/75 backdrop-blur-xl">
          <OperationalHeader
            homeHref="/dashboard/affiliate/overview"
            title="Afiliado"
            actions={
              <>
              <PrivilegedRoleMenu />
              <NotificationBell href="/dashboard/affiliate/notifications" />
              <form
                action={async () => {
                  "use server";
                  const { signOut } = await import("@/lib/actions/auth");
                  await signOut();
                }}
              >
                <button
                  type="submit"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 text-red-300 transition hover:text-red-200"
                  aria-label="Sair"
                >
                  <LogOut size={16} strokeWidth={1.7} />
                </button>
              </form>
              </>
            }
          />

          <div className="px-4 pb-4">
            <DashboardCascadeMenu label="Menu do Afiliado" triggerLabel="Afiliado" items={affiliateLinks} />
          </div>
        </header>

        <main className="flex-1 fantasyia-no-horizontal-scroll">{children}</main>
      </div>
    </div>
  );
}
