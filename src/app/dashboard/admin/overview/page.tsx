import Link from "next/link";
import { AlertTriangle, ArrowUpRight, Link2, ShieldCheck, UserCheck, Users, Activity } from "lucide-react";
import { getAdminStats } from "@/lib/actions/admin";

export const metadata = { title: "Visão Geral | Admin Fantasyia" };

export default async function AdminOverview() {
  const stats = await getAdminStats();

  const metrics = [
    { label: "Usuários", value: stats.totalUsers, icon: <Users size={16} /> },
    { label: "Creators", value: stats.totalCreators, icon: <UserCheck size={16} /> },
    { label: "Assinantes", value: stats.totalSubscribers, icon: <ShieldCheck size={16} /> },
    { label: "Publicações", value: stats.totalPosts, icon: <AlertTriangle size={16} /> },
  ];

  const quickActions = [
    { href: "/dashboard/admin/settings", label: "Gerar convite", description: "Criar link para Creator, Afiliado, Blog ou User." },
    { href: "/dashboard/admin/kyc", label: "Revisar KYC", description: "Aprovar ou reprovar creators pendentes." },
    { href: "/dashboard/admin/moderation", label: "Auditar mídia", description: "Checar posts livres, premium e PPV." },
    { href: "/dashboard/admin/refunds", label: "Fila financeira", description: "Reembolsos e eventos sensíveis." },
  ];

  return (
    <div className="space-y-6 px-4 py-6 pb-24">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-brand-surface-low px-5 py-6">
        <div className="absolute inset-0 opacity-20 brand-gradient" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-brand-bg/90" />
        
        <div className="relative z-10 flex flex-col gap-2">
          <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-500/20 px-2.5 py-1 text-[10px] uppercase tracking-widest text-brand-300">
            <Activity size={12} />
            Admin CRM
          </div>
          <h1 className="text-2xl font-semibold text-white">
            Cockpit <span className="brand-gradient-text">Operacional</span>
          </h1>
          <p className="text-sm text-brand-text-muted">
            Controle mobile-first para usuários, KYC, moderação e financeiro.
          </p>
        </div>
      </section>

      {/* Metrics Grid */}
      <section className="grid grid-cols-2 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className="flex flex-col gap-1 rounded-xl border border-white/5 bg-brand-surface-low p-4">
            <div className="flex items-center gap-2 text-brand-text-muted">
              <span className="text-brand-400">{m.icon}</span>
              <span className="text-[10px] uppercase tracking-wider">{m.label}</span>
            </div>
            <p className="text-xl font-medium text-white">{m.value.toLocaleString("pt-BR")}</p>
          </div>
        ))}
      </section>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <Link
        href="/dashboard/admin/settings"
        className="flex items-center justify-between rounded-[24px] border border-brand-500/20 bg-brand-500/10 p-5 transition hover:bg-brand-500/15"
      >
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-brand-300">Convites</p>
          <h2 className="mt-2 text-lg font-semibold text-white">Gerar link de acesso</h2>
          <p className="mt-1 text-xs leading-5 text-brand-text-muted">Enviar por WhatsApp ou email.</p>
        </div>
        <Link2 size={20} className="text-brand-300" />
      </Link>

      {/* Quick Actions List */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-white">Ações Rápidas</h2>
        <div className="space-y-2">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group flex items-center justify-between rounded-xl border border-white/5 bg-brand-surface-low p-4 transition hover:border-brand-500/20 hover:bg-white/[0.03]"
            >
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-white transition group-hover:text-brand-400">
                  {action.label}
                </span>
                <span className="text-xs text-brand-text-muted">
                  {action.description}
                </span>
              </div>
              <ArrowUpRight size={18} className="text-brand-text-muted transition group-hover:text-brand-400" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
