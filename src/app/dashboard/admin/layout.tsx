import {
  AlertTriangle,
  DollarSign,
  Eye,
  Link2,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { DashboardCascadeMenu } from "@/components/layouts/DashboardCascadeMenu";
import { OperationalHeader } from "@/components/layouts/OperationalHeader";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { PrivilegedRoleMenu } from "@/components/auth/PrivilegedRoleMenu";

const adminLinks = [
  { href: "/dashboard/admin/overview", icon: <LayoutDashboard size={18} strokeWidth={1.5} />, label: "Geral" },
  { href: "/dashboard/admin/settings#convites", icon: <Link2 size={18} strokeWidth={1.5} />, label: "Convites" },
  { href: "/dashboard/admin/users", icon: <Users size={18} strokeWidth={1.5} />, label: "Usuarios" },
  { href: "/dashboard/admin/kyc", icon: <ShieldCheck size={18} strokeWidth={1.5} />, label: "KYC" },
  { href: "/dashboard/admin/moderation", icon: <Eye size={18} strokeWidth={1.5} />, label: "Midia" },
  { href: "/dashboard/admin/finances", icon: <DollarSign size={18} strokeWidth={1.5} />, label: "Financeiro" },
  { href: "/dashboard/admin/refunds", icon: <RefreshCw size={18} strokeWidth={1.5} />, label: "Reembolsos" },
  { href: "/dashboard/admin/chargebacks", icon: <AlertTriangle size={18} strokeWidth={1.5} />, label: "Risco" },
  { href: "/dashboard/admin/settings", icon: <Settings size={18} strokeWidth={1.5} />, label: "Ajustes" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh justify-center bg-[radial-gradient(circle_at_top_left,rgba(0,168,107,0.12),transparent_34%),linear-gradient(180deg,#070908_0%,#030303_100%)] text-brand-text">
      <div className="app-shell flex flex-col border-x border-white/8 bg-black/30 shadow-[0_24px_90px_rgba(0,0,0,0.42)]">
        <header className="sticky top-0 z-40 border-b border-white/8 bg-black/75 backdrop-blur-xl">
          <OperationalHeader
            homeHref="/dashboard/admin/overview"
            title="Admin"
            actions={
              <>
              <PrivilegedRoleMenu />
              <NotificationBell href="/dashboard/admin/notifications" />
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
                  <LogOut size={16} strokeWidth={1.6} />
                </button>
              </form>
              </>
            }
          />

          <div className="px-4 pb-4">
            <DashboardCascadeMenu label="Menu do Admin" triggerLabel="Admin" items={adminLinks} />
          </div>
        </header>

        <main className="flex-1 fantasyia-no-horizontal-scroll">{children}</main>
      </div>
    </div>
  );
}
