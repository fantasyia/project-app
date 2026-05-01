import { getRefundRequests } from "@/lib/actions/financial";
import { RefundsClient } from "./refunds-client";

export const metadata = { title: "Reembolsos | Admin Fantasyia" };

export default async function RefundsPage() {
  const refunds = await getRefundRequests();

  return (
    <div className="w-full space-y-6 px-4 py-5 pb-24">
      <div className="rounded-[32px] border border-white/8 bg-white/[0.035] p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-brand-300">Finance desk</p>
        <h1 className="mt-3 text-4xl font-thin tracking-[-0.05em] text-white">
          Reembolsos <span className="text-brand-500">e suporte</span>
        </h1>
        <p className="mt-3 text-sm leading-6 text-brand-text-muted">
          {refunds.length} solicitacoes aguardando revisao ou historico.
        </p>
      </div>

      <RefundsClient initialData={refunds} />
    </div>
  );
}
