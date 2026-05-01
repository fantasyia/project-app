import Link from "next/link";
import { getCurrentUser } from "@/lib/actions/auth";
import { getCreatorStudioSnapshot } from "@/lib/actions/wallet";
import { ArrowUpRight, Crown, Plus, Radar, Wallet, BarChart3, TrendingUp } from "lucide-react";

export const metadata = { title: "Painel Geral | Fantasyia" };

export default async function StudioPage() {
  const user = await getCurrentUser("creator");
  const snapshot = await getCreatorStudioSnapshot();
  const { wallet, totals, planMix, recentUnlocks } = snapshot;
  const firstName = user?.display_name?.split(" ")[0] || "Creator";

  return (
    <div className="space-y-6 pb-20">
      {/* Welcome Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-brand-surface-low px-5 py-6">
        <div className="absolute inset-0 opacity-20 brand-gradient" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-brand-bg/90" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-500/20 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-brand-300">
            <Radar size={12} />
            Studio Ativo
          </div>
          <h1 className="mt-3 text-2xl font-semibold text-white">
            Olá, <span className="brand-gradient-text">{firstName}</span>
          </h1>
          <p className="mt-1 text-sm text-brand-text-muted">
            Sua operação comercial e audiência em tempo real.
          </p>
          
          {/* Quick Actions */}
          <div className="mt-5 flex gap-3">
            <Link
              href="/dashboard/creator/posts/create"
              className="brand-gradient-btn flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-xs font-semibold text-black shadow-lg"
            >
              <Plus size={14} />
              Novo post
            </Link>
            <Link
              href="/dashboard/creator/plans"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-xs font-medium text-white transition hover:bg-white/10"
            >
              Planos
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Main Stats Row */}
      <section className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1 rounded-2xl border border-white/5 bg-brand-surface-low p-4">
          <div className="flex items-center gap-2 text-brand-text-muted">
            <Wallet size={14} className="text-brand-400" />
            <span className="text-[10px] uppercase tracking-wider">Carteira</span>
          </div>
          <p className="text-xl font-medium text-white">R$ {wallet.balance}</p>
        </div>
        <div className="flex flex-col gap-1 rounded-2xl border border-white/5 bg-brand-surface-low p-4">
          <div className="flex items-center gap-2 text-brand-text-muted">
            <Crown size={14} className="text-brand-300" />
            <span className="text-[10px] uppercase tracking-wider">Recorrência</span>
          </div>
          <p className="text-xl font-medium text-white">R$ {totals.recurringProjection.toFixed(2)}</p>
        </div>
      </section>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Analytics List */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 size={16} className="text-brand-text-muted" />
          <h2 className="text-sm font-medium text-white">Mix do Catálogo</h2>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-white/5 bg-brand-surface-low p-3">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-white/70" />
              <span className="text-sm text-brand-text-muted">Posts Grátis</span>
            </div>
            <span className="text-sm font-medium text-white">{totals.freePosts}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-brand-500/10 bg-brand-500/5 p-3">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-brand-400 shadow-[0_0_8px_rgba(0,168,107,0.8)]" />
              <span className="text-sm text-brand-text-muted">Premium</span>
            </div>
            <span className="text-sm font-medium text-white">{totals.premiumPosts}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-white/5 bg-brand-surface-low p-3">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-emerald-300" />
              <span className="text-sm text-brand-text-muted">Pay-Per-View</span>
            </div>
            <span className="text-sm font-medium text-white">{totals.ppvPosts}</span>
          </div>
        </div>
      </section>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Recent PPV / Ledger */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-brand-text-muted" />
            <h2 className="text-sm font-medium text-white">Últimos Unlocks PPV</h2>
          </div>
          <span className="text-xs font-medium text-brand-400">{totals.totalUnlocks} total</span>
        </div>

        <div className="space-y-2">
          {recentUnlocks.length === 0 ? (
            <p className="py-4 text-center text-sm text-brand-text-muted">
              Nenhum unlock registrado ainda.
            </p>
          ) : (
            recentUnlocks.slice(0, 3).map((unlock) => (
              <div key={unlock.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-brand-surface-low px-4 py-3">
                <p className="text-sm text-brand-text-base">Unlock de conteúdo</p>
                <span className="font-medium text-brand-300">
                  + R$ {Number.parseFloat(unlock.amount_paid || "0").toFixed(2)}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
      
      {/* Active Plans */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Crown size={16} className="text-brand-text-muted" />
          <h2 className="text-sm font-medium text-white">Escada de Planos</h2>
        </div>

        <div className="space-y-2">
          {planMix.length === 0 ? (
            <p className="py-4 text-center text-sm text-brand-text-muted">
              Nenhum plano ativo.
            </p>
          ) : (
            planMix.map((plan) => (
              <div key={plan.id} className="flex flex-col gap-2 rounded-xl border border-white/5 bg-brand-surface-low p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-white">{plan.name}</p>
                  <span className="rounded bg-brand-500/10 px-2 py-0.5 text-xs font-semibold text-brand-400">
                    {plan.subscribers} subs
                  </span>
                </div>
                <p className="text-xs text-brand-text-muted">
                  R$ {plan.price}/mês · projeção <span className="text-white">R$ {plan.monthlyProjection.toFixed(2)}</span>
                </p>
              </div>
            ))
          )}
        </div>
      </section>

    </div>
  );
}
