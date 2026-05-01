"use client";

import { useState, useTransition } from "react";
import { CheckCircle, Clock, DollarSign, XCircle } from "lucide-react";
import { processRefund } from "@/lib/actions/financial";

type RefundRequest = {
  id: string;
  amount: string | number | null;
  status: string;
  reason?: string | null;
  created_at: string;
};

export function RefundsClient({ initialData }: { initialData: RefundRequest[] }) {
  const [refunds, setRefunds] = useState(initialData);
  const [pending, startTransition] = useTransition();

  function handleAction(id: string, action: "approved" | "rejected") {
    startTransition(async () => {
      await processRefund(id, action);
      setRefunds((prev) => prev.map((refund) => (refund.id === id ? { ...refund, status: action } : refund)));
    });
  }

  const statusIcon: Record<string, React.ReactNode> = {
    pending: <Clock size={15} className="text-amber-300" />,
    approved: <CheckCircle size={15} className="text-brand-300" />,
    rejected: <XCircle size={15} className="text-red-300" />,
  };

  if (refunds.length === 0) {
    return (
      <div className="rounded-[30px] border border-dashed border-white/10 bg-black/25 px-6 py-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/5">
          <DollarSign size={24} className="text-brand-text-muted" />
        </div>
        <h2 className="text-xl font-light text-white">Nenhum reembolso aberto</h2>
        <p className="mt-2 text-sm leading-6 text-brand-text-muted">Solicitacoes de reembolso aparecem aqui para decisao.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {refunds.map((refund) => (
        <article key={refund.id} className="rounded-[26px] border border-white/8 bg-black/30 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-white/[0.05]">
              {statusIcon[refund.status] || statusIcon.pending}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-light tracking-tight text-white">R$ {Number(refund.amount).toFixed(2)}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-brand-text-muted">{refund.reason || "Sem motivo informado"}</p>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${refund.status === "approved" ? "text-brand-300" : refund.status === "rejected" ? "text-red-300" : "text-amber-300"}`}>
                  {refund.status === "approved" ? "Aprovado" : refund.status === "rejected" ? "Rejeitado" : "Pendente"}
                </span>
              </div>

              <p className="mt-3 text-[10px] uppercase tracking-[0.24em] text-brand-text-muted">
                {new Date(refund.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
              </p>

              {refund.status === "pending" && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleAction(refund.id, "approved")}
                    disabled={pending}
                    className="rounded-2xl border border-brand-500/20 bg-brand-500/10 px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-brand-300 transition hover:bg-brand-500/20 disabled:opacity-50"
                  >
                    Aprovar
                  </button>
                  <button
                    onClick={() => handleAction(refund.id, "rejected")}
                    disabled={pending}
                    className="rounded-2xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
                  >
                    Rejeitar
                  </button>
                </div>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
