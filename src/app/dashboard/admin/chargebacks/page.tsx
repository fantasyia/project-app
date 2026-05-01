import { getChargebackCases } from "@/lib/actions/financial";
import { ChargebacksClient } from "./chargebacks-client";

export const metadata = { title: "Chargebacks | Admin Fantasyia" };

export default async function ChargebacksPage() {
  const cases = await getChargebackCases();

  return (
    <div className="w-full space-y-6 px-4 py-5 pb-24">
      <div className="rounded-[32px] border border-white/8 bg-white/[0.035] p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-brand-300">Risk desk</p>
        <h1 className="mt-3 text-4xl font-thin tracking-[-0.05em] text-white">
          Chargebacks <span className="text-brand-500">e disputas</span>
        </h1>
        <p className="mt-3 text-sm leading-6 text-brand-text-muted">
          {cases.length} casos para acompanhamento de risco financeiro.
        </p>
      </div>

      <ChargebacksClient initialData={cases} />
    </div>
  );
}
