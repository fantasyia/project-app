import { Landmark, LockKeyhole, ReceiptText } from "lucide-react";

export const metadata = { title: "Financeiro | Admin Fantasyia" };

export default function FinancesPage() {
  return (
    <div className="w-full space-y-6 px-4 py-5 pb-24">
      <div className="rounded-[32px] border border-white/8 bg-white/[0.035] p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-brand-300">Finance desk</p>
        <h1 className="mt-3 text-4xl font-thin tracking-[-0.05em] text-white">
          Financeiro <span className="text-brand-500">global</span>
        </h1>
        <p className="mt-3 text-sm leading-6 text-brand-text-muted">
          Area reservada para conciliacao, taxas, payouts e auditoria financeira do gateway real.
        </p>
      </div>

      <div className="grid gap-3">
        {[
          { icon: <ReceiptText size={18} />, title: "Ledger", text: "Razao financeiro imutavel e trilhas sensiveis." },
          { icon: <Landmark size={18} />, title: "Payouts", text: "Repasses para creators e afiliados." },
          { icon: <LockKeyhole size={18} />, title: "Gateway", text: "Integracao final segue bloqueada para pre-lancamento." },
        ].map((item) => (
          <div key={item.title} className="rounded-[28px] border border-white/8 bg-black/30 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-300">{item.icon}</div>
            <h2 className="mt-5 text-lg font-light text-white">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-brand-text-muted">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
