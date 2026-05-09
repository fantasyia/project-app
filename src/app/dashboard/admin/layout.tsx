import Link from "next/link";
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(0,168,107,0.12),transparent_34%),linear-gradient(180deg,#070908_0%,#030303_100%)] text-brand-text">
      <div className="mx-auto min-h-screen w-full max-w-md border-x border-white/8 bg-black/30 shadow-[0_24px_90px_rgba(0,0,0,0.42)] md:max-w-[768px]">
        <header className="sticky top-0 z-40 border-b border-white/8 bg-black/75 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 py-4">
            <Link href="/dashboard/admin/overview" className="text-lg font-thin uppercase tracking-[0.2em] text-white">
              Fantasy<span className="text-brand-500">ia</span>
            </Link>
            <div className="flex items-center gap-2">
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
            </div>
          </div>

          <div className="px-4 pb-3">
            <div className="rounded-3xl border border-brand-500/20 bg-brand-500/10 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-brand-300">Admin CRM</p>
              <p className="mt-2 text-xs leading-5 text-brand-text-base">
                Operacao mobile para risco, usuarios, KYC e financeiro.
              </p>
            </div>
          </div>

          <div className="px-4 pb-4">
            <DashboardCascadeMenu label="Menu do Admin CRM" triggerLabel="Admin CRM" items={adminLinks} />
          </div>
        </header>

        <main>{children}</main>
      </div>
    </div>
  );
}
