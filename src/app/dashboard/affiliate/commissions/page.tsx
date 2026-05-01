import { getAffiliateCommissions } from "@/lib/actions/affiliate";

type AffiliateCommission = {
  id: string;
  amount: string | number;
  commission_rate: string | number;
  is_recurring: boolean;
  status: string;
  created_at: string;
  link?: {
    creator?: {
      handle?: string | null;
    } | null;
  } | null;
};

export const metadata = { title: "Comissoes | Afiliado Fantasyia" };

export default async function CommissionsPage() {
  const commissions = (await getAffiliateCommissions()) as AffiliateCommission[];

  return (
    <div className="w-full space-y-6 px-4 py-5 pb-24">
      <section className="rounded-[32px] border border-white/8 bg-white/[0.035] p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-brand-300">Financeiro</p>
        <h1 className="mt-3 text-4xl font-thin tracking-[-0.05em] text-white">
          Minhas <span className="text-brand-500">comissoes</span>
        </h1>
        <p className="mt-3 text-sm leading-6 text-brand-text-muted">
          Historico detalhado de pagamentos por conversoes afiliadas.
        </p>
      </section>

      {commissions.length === 0 ? (
        <section className="rounded-[28px] border border-dashed border-white/10 bg-black/25 px-5 py-12 text-center">
          <p className="text-sm text-brand-text-muted">Nenhuma comissao registrada ainda.</p>
          <p className="mt-2 text-xs text-brand-text-muted">Gere links e comece a converter para abrir este historico.</p>
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-3">
          {commissions.map((commission) => (
            <article key={commission.id} className="rounded-[24px] border border-white/8 bg-black/30 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-brand-text-muted">
                    {new Date(commission.created_at).toLocaleDateString("pt-BR")}
                  </p>
                  <p className="mt-1 text-lg font-light tracking-tight text-white">R$ {commission.amount}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-widest ${
                    commission.status === "paid"
                      ? "bg-brand-500/20 text-brand-300"
                      : commission.status === "voided"
                        ? "bg-red-500/20 text-red-300"
                        : "bg-yellow-500/20 text-yellow-300"
                  }`}
                >
                  {commission.status === "paid" ? "Pago" : commission.status === "voided" ? "Cancelado" : "Pendente"}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                  <p className="text-[9px] uppercase tracking-[0.2em] text-brand-text-muted">Creator</p>
                  <p className="mt-1 truncate text-xs text-white">{commission.link?.creator?.handle ? `@${commission.link.creator.handle}` : "-"}</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                  <p className="text-[9px] uppercase tracking-[0.2em] text-brand-text-muted">Taxa</p>
                  <p className="mt-1 text-xs text-white">{(Number(commission.commission_rate) * 100).toFixed(0)}%</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                  <p className="text-[9px] uppercase tracking-[0.2em] text-brand-text-muted">Tipo</p>
                  <p className="mt-1 text-xs text-white">{commission.is_recurring ? "Recorrente" : "Inicial"}</p>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
