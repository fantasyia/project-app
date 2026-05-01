"use client";

import { useState, useTransition } from "react";
import { updateKycStatus } from "@/lib/actions/admin";
import { Check, X } from "lucide-react";

type KycPendingItem = {
  user_id: string;
  user?: KycUser | KycUser[] | null;
};

type KycUser = {
  display_name?: string | null;
  handle?: string | null;
  created_at?: string | null;
};

function takeFirstUser(value: KycPendingItem["user"]) {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export function KycClient({ initialPending }: { initialPending: KycPendingItem[] }) {
  const [pendingList, setPendingList] = useState(initialPending);
  const [isPending, startTransition] = useTransition();

  function handleAction(userId: string, action: "approved" | "rejected") {
    startTransition(async () => {
      const result = await updateKycStatus(userId, action);
      if (result.success) {
        setPendingList((prev) => prev.filter((item) => item.user_id !== userId));
      } else {
        alert("Erro ao atualizar status: " + result.error);
      }
    });
  }

  if (pendingList.length === 0) {
    return (
      <div className="rounded-[30px] border border-dashed border-white/10 bg-black/25 px-6 py-16 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-300">Fila limpa</p>
        <h2 className="mt-3 text-xl font-light text-white">Nenhum KYC pendente</h2>
        <p className="mt-2 text-sm leading-6 text-brand-text-muted">Novas solicitacoes de creators aparecem aqui para triagem.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {pendingList.map((item) => {
        const user = takeFirstUser(item.user);

        return (
          <div key={item.user_id} className="group relative overflow-hidden rounded-[28px] border border-white/8 bg-black/30 p-5">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-500/8 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

            <div className="relative z-10">
              <div className="mb-5 flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold tracking-tight text-white">{user?.display_name || "Desconhecido"}</h3>
                  <p className="text-sm text-brand-text-muted">@{user?.handle || "sem-handle"}</p>
                </div>
                <span className="rounded-full bg-yellow-500/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-yellow-300">
                  Pendente
                </span>
              </div>

              <div className="mb-6 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-brand-text-muted">Conta criada</span>
                  <span className="font-mono text-xs text-white">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString("pt-BR") : "Sem data"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleAction(item.user_id, "rejected")}
                  disabled={isPending}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 py-3 text-xs font-bold uppercase tracking-widest text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                >
                  <X size={16} /> Reprovar
                </button>
                <button
                  onClick={() => handleAction(item.user_id, "approved")}
                  disabled={isPending}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-brand-500 py-3 text-xs font-bold uppercase tracking-widest text-black shadow-[0_0_15px_rgba(0,168,107,0.2)] transition-colors hover:bg-brand-400 disabled:opacity-50"
                >
                  <Check size={16} /> Aprovar
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
