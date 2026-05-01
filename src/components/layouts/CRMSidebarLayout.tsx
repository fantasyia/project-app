import Link from "next/link";
import { LayoutDashboard, UserCheck, DollarSign, LogOut, Settings, Edit3 } from "lucide-react";

export default function CRMSidebarLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col md:flex-row text-brand-text">
      {/* Sidebar Desktop Fixa */}
      <aside className="w-full md:w-64 bg-brand-surface-low border-r border-white/5 flex-col hidden md:flex h-screen sticky top-0">
        <div className="p-6 pb-8 border-b border-white/5">
          <Link href="/dashboard" className="text-xl font-thin tracking-[0.2em] uppercase text-white">
            Fantasy<span className="text-brand-500">ia</span>
          </Link>
          <p className="text-[10px] font-semibold tracking-widest text-brand-text-muted uppercase mt-2">Operational</p>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto scrollbar-hide py-6">
          <span className="text-[10px] font-semibold text-brand-500 uppercase tracking-[0.2em] mb-3 px-4">Global</span>
          <SidebarLink href="/dashboard/admin/overview" icon={<LayoutDashboard size={18} strokeWidth={1.5} />} label="Painel Admin" />

          <span className="text-[10px] font-semibold text-brand-500 uppercase tracking-[0.2em] mb-3 px-4 mt-6">Criação</span>
          <SidebarLink href="/dashboard/creator/studio" icon={<UserCheck size={18} strokeWidth={1.5} />} label="Creator Studio" />

          <span className="text-[10px] font-semibold text-brand-500 uppercase tracking-[0.2em] mb-3 px-4 mt-6">Parcerias</span>
          <SidebarLink href="/dashboard/affiliate/overview" icon={<DollarSign size={18} strokeWidth={1.5} />} label="Afiliados VIP" />

          <span className="text-[10px] font-semibold text-brand-500 uppercase tracking-[0.2em] mb-3 px-4 mt-6">Editorial</span>
          <SidebarLink href="/dashboard/blog" icon={<Edit3 size={18} strokeWidth={1.5} />} label="Blog CMS" />
        </nav>

        <div className="p-4 border-t border-white/5">
          <SidebarLink href="/dashboard/user/account" icon={<Settings size={18} strokeWidth={1.5} />} label="Sua Conta" />
          <SidebarLink href="/" icon={<LogOut size={18} strokeWidth={1.5} />} label="Sair da plataforma" />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

function SidebarLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-4 px-4 py-3 text-sm font-light text-brand-text hover:text-brand-500 hover:bg-white/5 transition-colors">
      {icon}
      {label}
    </Link>
  );
}
