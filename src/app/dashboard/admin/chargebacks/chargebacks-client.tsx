"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Check, Shield, X } from "lucide-react";
import { updateChargebackStatus } from "@/lib/actions/financial";

type ChargebackCase = {
  id: string;
  amount: string | number | null;
  status: string;
  reason?: string | null;
  created_at: string;
};

export function ChargebacksClient({ initialData }: { initialData: ChargebackCase[] }) {
  const [cases, setCases] = useState(initialData);
  const [pending, startTransition] = useTransition();

  function handleStatus(id: string, status: string) {
    startTransition(async () => {
      await updateChargebackStatus(id, status);
      setCases((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
    });
  }

  const statusColors: Record<string, string> = {
    open: "text-amber-300",
    under_review: "text-blue-300",
    won: "text-brand-300",
    lost: "text-red-300",
    closed: "text-brand-text-muted",
  };

  const statusLabels: Record<string, string> = {
    open: "Aberto",
    under_review: "Em analise",
    won: "Ganho",
    lost: "Perdido",
    closed: "Encerrado",
  };

  if (cases.length === 0) {
    return (
      <div className="rounded-[30px] border border-dashed border-white/10 bg-black/25 px-6 py-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/5">
          <Shield size={24} className="text-brand-text-muted" />
        </div>
        <h2 className="text-xl font-light text-white">Nenhum chargeback aberto</h2>
        <p className="mt-2 text-sm leading-6 text-brand-text-muted">Casos de disputa aparecem aqui para acompanhamento.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {cases.map((item) => (
        <article key={item.id} className="rounded-[26px] border border-white/8 bg-black/30 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-500/10">
              <AlertTriangle size={16} className={statusColors[item.status] || "text-amber-300"} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-light tracking-tight text-white">R$ {Number(item.amount).toFixed(2)}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.24em] text-brand-text-muted">
                    {new Date(item.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${statusColors[item.status] || "text-amber-300"}`}>
                  {statusLabels[item.status] || item.status}
                </span>
              </div>

              {item.reason && <p className="mt-3 text-sm leading-6 text-brand-text-muted">{item.reason}</p>}

              {(item.status === "open" || item.status === "under_review") && (
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {item.status === "open" && (
                    <button
                      onClick={() => handleStatus(item.id, "under_review")}
                      disabled={pending}
                      className="rounded-2xl border border-blue-500/20 bg-blue-500/10 px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-blue-300 transition hover:bg-blue-500/20 disabled:opacity-50"
                    >
                      Analisar
                    </button>
                  )}
                  <button
                    onClick={() => handleStatus(item.id, "won")}
                    disabled={pending}
                    className="rounded-2xl border border-brand-500/20 bg-brand-500/10 px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-brand-300 transition hover:bg-brand-500/20 disabled:opacity-50"
                  >
                    <Check size={12} className="inline" /> Ganho
                  </button>
                  <button
                    onClick={() => handleStatus(item.id, "lost")}
                    disabled={pending}
                    className="rounded-2xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
                  >
                    <X size={12} className="inline" /> Perdido
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
