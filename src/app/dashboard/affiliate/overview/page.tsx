import Link from "next/link";
import { DollarSign, Link as LinkIcon, RefreshCw, Star, TrendingUp } from "lucide-react";
import { getAffiliateEarnings, getAffiliateLinks, getAffiliateStats } from "@/lib/actions/affiliate";

export const metadata = { title: "Visao Geral | Afiliado Fantasyia" };

type AffiliateTracking = {
  id: string;
  is_conversion: boolean | null;
};

type AffiliateLink = {
  id: string;
  utm_code: string;
  created_at: string;
  creator?: {
    handle?: string | null;
  } | null;
  tracking?: AffiliateTracking[] | null;
};

export default async function AffiliateOverview() {
  const stats = await getAffiliateStats();
  const links = (await getAffiliateLinks()) as AffiliateLink[];
  const earnings = await getAffiliateEarnings();

  const metrics = [
    { title: "Links gerados", value: stats.totalLinks.toString(), icon: <LinkIcon size={16} className="text-brand-300" /> },
    { title: "Cliques", value: stats.totalClicks.toLocaleString("pt-BR"), icon: <TrendingUp size={16} className="text-brand-300" /> },
    { title: "Conversoes", value: stats.totalConversions.toString(), icon: <Star size={16} className="text-brand-300" /> },
  ];

  return (
    <div className="w-full space-y-6 px-4 py-5 pb-24">
      <section className="rounded-[32px] border border-white/8 bg-white/[0.035] p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-brand-300">Performance</p>
        <h1 className="mt-3 text-4xl font-thin tracking-[-0.05em] text-white">
          Portal <span className="text-brand-500">afiliado</span>
        </h1>
        <p className="mt-3 text-sm leading-6 text-brand-text-muted">
          Visao consolidada de ganhos, volume de cliques e conversoes.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-3">
        <div className="rounded-[28px] border border-brand-500/20 bg-brand-500/10 p-5">
          <div className="flex items-center gap-2">
            <DollarSign size={16} className="text-brand-300" />
            <span className="text-[10px] font-bold uppercase tracking-[0.26em] text-brand-300">Ganhos totais</span>
          </div>
          <p className="mt-4 text-4xl font-thin tracking-tight text-white">R$ {earnings.totalEarned}</p>
          <p className="mt-2 text-xs text-brand-text-muted">{earnings.totalCommissions} comissoes registradas</p>
        </div>

        <div className="rounded-[28px] border border-white/8 bg-black/30 p-5">
          <div className="flex items-center gap-2">
            <DollarSign size={16} className="text-yellow-300" />
            <span className="text-[10px] font-bold uppercase tracking-[0.26em] text-brand-text-muted">Pendente</span>
          </div>
          <p className="mt-4 text-3xl font-thin tracking-tight text-yellow-300">R$ {earnings.pendingEarned}</p>
          <p className="mt-2 text-xs text-brand-text-muted">Aguardando fechamento de payout</p>
        </div>

        <div className="rounded-[28px] border border-white/8 bg-black/30 p-5">
          <div className="flex items-center gap-2">
            <RefreshCw size={16} className="text-brand-300" />
            <span className="text-[10px] font-bold uppercase tracking-[0.26em] text-brand-text-muted">Recorrentes</span>
          </div>
          <p className="mt-4 text-3xl font-thin tracking-tight text-white">{earnings.recurringCount}</p>
          <p className="mt-2 text-xs text-brand-text-muted">Renovacoes comissionadas</p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3">
        {metrics.map((metric) => (
          <div key={metric.title} className="rounded-[24px] border border-white/8 bg-black/30 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-text-muted">{metric.title}</p>
              {metric.icon}
            </div>
            <p className="mt-3 text-3xl font-thin tracking-tight text-white">{metric.value}</p>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.26em] text-white">Links recentes</h2>
          <Link href="/dashboard/affiliate/links" className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-300">
            Novo link
          </Link>
        </div>

        {links.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-white/10 bg-black/25 px-5 py-10 text-center">
            <p className="text-sm text-brand-text-muted">Nenhum link gerado ainda.</p>
            <Link href="/dashboard/affiliate/links" className="mt-4 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-brand-300">
              Gerar primeiro link
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {links.slice(0, 5).map((link) => (
              <article key={link.id} className="rounded-[24px] border border-white/8 bg-black/30 p-4">
                <p className="text-xs text-white">?ref={link.utm_code}</p>
                <div className="mt-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-brand-text-muted">
                  <span>{new Date(link.created_at).toLocaleDateString("pt-BR")}</span>
                  {link.creator?.handle && <span>@{link.creator.handle}</span>}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                    <p className="text-[9px] uppercase tracking-[0.2em] text-brand-text-muted">Cliques</p>
                    <p className="mt-1 text-sm text-brand-300">{link.tracking?.length || 0}</p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                    <p className="text-[9px] uppercase tracking-[0.2em] text-brand-text-muted">Conversoes</p>
                    <p className="mt-1 text-sm text-brand-300">{link.tracking?.filter((item) => item.is_conversion).length || 0}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
