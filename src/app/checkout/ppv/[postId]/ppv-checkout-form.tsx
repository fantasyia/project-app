"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Lock,
  QrCode,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { mockUnlockPpv } from "@/lib/actions/checkout";

type PpvCheckoutFormProps = {
  creatorHandle: string;
  creatorName: string;
  hasActiveSubscription: boolean;
  hasUnlocked: boolean;
  isAuthenticated: boolean;
  isOwner: boolean;
  postId: string;
  priceLabel: string;
};

type CheckoutMethod = "card" | "pix" | "wallet";

const methodLabels: Record<CheckoutMethod, { label: string; description: string; icon: typeof CreditCard }> = {
  card: {
    label: "Cartao",
    description: "Fluxo principal de compra avulsa para o post bloqueado.",
    icon: CreditCard,
  },
  pix: {
    label: "Pix",
    description: "Confirmacao rapida para unlock imediato.",
    icon: QrCode,
  },
  wallet: {
    label: "Saldo",
    description: "Opcao reservada para carteira interna e creditos promocionais.",
    icon: Wallet,
  },
};

export function PpvCheckoutForm({
  creatorHandle,
  creatorName,
  hasActiveSubscription,
  hasUnlocked,
  isAuthenticated,
  isOwner,
  postId,
  priceLabel,
}: PpvCheckoutFormProps) {
  const [pending, startTransition] = useTransition();
  const [method, setMethod] = useState<CheckoutMethod>("pix");
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await mockUnlockPpv(postId);

      if (result?.success) {
        setCompleted(true);
        return;
      }

      setError(result?.error || "Nao foi possivel concluir o unlock agora.");
    });
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-500/20 bg-brand-500/10 text-brand-300">
          <Lock size={20} />
        </div>
        <h3 className="mt-5 text-2xl font-light tracking-tight">Entre para liberar o PPV</h3>
        <p className="mt-3 text-sm leading-6 text-brand-text-muted">
          Para proteger sua compra e registrar o unlock corretamente, entre antes de continuar.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-500 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-black transition hover:bg-brand-400"
          >
            Entrar
            <ChevronRight size={14} />
          </Link>
          <Link
            href={`/${creatorHandle}`}
            className="inline-flex items-center justify-center rounded-full border border-white/10 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-brand-text-muted transition hover:border-white/20 hover:text-white"
          >
            Voltar ao perfil
          </Link>
        </div>
      </div>
    );
  }

  if (isOwner) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-brand-300">
          <ShieldCheck size={20} />
        </div>
        <h3 className="mt-5 text-2xl font-light tracking-tight">Conteudo do proprio creator</h3>
        <p className="mt-3 text-sm leading-6 text-brand-text-muted">
          O owner do perfil nao precisa comprar o proprio PPV.
        </p>
        <Link
          href={`/${creatorHandle}`}
          className="mt-6 inline-flex items-center justify-center rounded-full border border-white/10 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-brand-text-muted transition hover:border-white/20 hover:text-white"
        >
          Voltar ao perfil
        </Link>
      </div>
    );
  }

  if (hasUnlocked) {
    return (
      <div className="rounded-[28px] border border-brand-500/20 bg-brand-500/10 p-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-500/25 bg-black/20 text-brand-300">
          <CheckCircle2 size={20} />
        </div>
        <h3 className="mt-5 text-2xl font-light tracking-tight">PPV ja desbloqueado</h3>
        <p className="mt-3 text-sm leading-6 text-brand-text-base">
          Este post unitario ja esta liberado para sua conta. Voce pode voltar ao perfil de {creatorName} ou abrir seu historico de compras.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link
            href={`/${creatorHandle}`}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-500 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-black transition hover:bg-brand-400"
          >
            Abrir perfil
            <ChevronRight size={14} />
          </Link>
          <Link
            href="/dashboard/user/purchases"
            className="inline-flex items-center justify-center rounded-full border border-white/10 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-brand-text-muted transition hover:border-white/20 hover:text-white"
          >
            Ver compras
          </Link>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="rounded-[28px] border border-brand-500/20 bg-brand-500/10 p-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-500/25 bg-black/20 text-brand-300">
          <CheckCircle2 size={20} />
        </div>
        <p className="mt-5 text-[10px] uppercase tracking-[0.32em] text-brand-300">Unlock confirmado</p>
        <h3 className="mt-3 text-3xl font-light tracking-tight">Conteudo liberado</h3>
        <p className="mt-3 text-sm leading-6 text-brand-text-base">
          O PPV foi confirmado e o post pode ser aberto normalmente no perfil de {creatorName}.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link
            href={`/${creatorHandle}`}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-500 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-black transition hover:bg-brand-400"
          >
            Abrir creator
            <ChevronRight size={14} />
          </Link>
          <Link
            href="/dashboard/user/purchases"
            className="inline-flex items-center justify-center rounded-full border border-white/10 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-brand-text-muted transition hover:border-white/20 hover:text-white"
          >
            Ver compras
          </Link>
        </div>
      </div>
    );
  }

  const activeMethod = methodLabels[method];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {hasActiveSubscription && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-brand-text-base">
          Sua assinatura ou trial com <span className="font-medium text-white">{creatorName}</span> continua ativa, mas este post permanece unitario e exige unlock proprio.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        {(Object.entries(methodLabels) as Array<[CheckoutMethod, typeof methodLabels.card]>).map(([key, value]) => {
          const Icon = value.icon;
          const selected = key === method;

          return (
            <button
              key={key}
              type="button"
              onClick={() => setMethod(key)}
              className={`rounded-[22px] border px-4 py-4 text-left transition ${
                selected
                  ? "border-brand-500/30 bg-brand-500/10 shadow-[0_0_24px_rgba(0,168,107,0.12)]"
                  : "border-white/10 bg-white/[0.03] hover:border-white/20"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                    selected ? "bg-brand-500/15 text-brand-300" : "bg-white/[0.05] text-brand-text-muted"
                  }`}
                >
                  <Icon size={16} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white">{value.label}</p>
                  <p className="mt-1 text-xs leading-5 text-brand-text-muted">{value.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-brand-text-muted">Metodo selecionado</p>
            <h3 className="mt-2 text-xl font-light tracking-tight">{activeMethod.label}</h3>
            <p className="mt-2 text-sm leading-6 text-brand-text-muted">{activeMethod.description}</p>
          </div>
          <div className="rounded-full border border-brand-500/20 bg-brand-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-brand-300">
            Seguro
          </div>
        </div>

        <div className="mt-5 grid gap-4">
          <label className="grid gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-text-muted">
              Nome de cobranca
            </span>
            <input
              required
              type="text"
              placeholder="Seu nome"
              className="h-12 rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-brand-500/40"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-text-muted">
              Email do recibo
            </span>
            <input
              required
              type="email"
              placeholder="voce@email.com"
              className="h-12 rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-brand-500/40"
            />
          </label>

          {method === "card" && (
            <>
              <label className="grid gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-text-muted">
                  Numero do cartao
                </span>
                <input
                  required
                  type="text"
                  inputMode="numeric"
                  placeholder="4242 4242 4242 4242"
                  className="h-12 rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-brand-500/40"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-text-muted">
                    Validade
                  </span>
                  <input
                    required
                    type="text"
                    placeholder="MM/AA"
                    className="h-12 rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-brand-500/40"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-text-muted">
                    CVV
                  </span>
                  <input
                    required
                    type="text"
                    inputMode="numeric"
                    placeholder="123"
                    className="h-12 rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-brand-500/40"
                  />
                </label>
              </div>
            </>
          )}

          {method === "pix" && (
            <div className="rounded-2xl border border-dashed border-brand-500/20 bg-brand-500/10 p-4">
              <p className="text-[10px] uppercase tracking-[0.28em] text-brand-300">Pix</p>
              <p className="mt-2 text-sm leading-6 text-brand-text-base">
                Confirme para concluir o unlock imediatamente.
              </p>
            </div>
          )}

          {method === "wallet" && (
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-[10px] uppercase tracking-[0.28em] text-brand-text-muted">Saldo interno</p>
              <p className="mt-2 text-sm leading-6 text-brand-text-base">
                Use creditos e saldo disponivel da plataforma quando esta opcao estiver ativa.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-black/35 p-5">
        <div className="flex items-start justify-between gap-3 border-b border-white/8 pb-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-brand-text-muted">Resumo</p>
            <h3 className="mt-2 text-xl font-light tracking-tight">Unlock avulso</h3>
          </div>
          <p className="text-2xl font-light tracking-tight text-brand-300">{priceLabel}</p>
        </div>
        <div className="mt-4 space-y-3 text-sm text-brand-text-muted">
          <div className="flex items-center justify-between gap-3">
            <span>Tipo</span>
            <span className="text-white">PPV unitario</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span>Creator</span>
            <span className="text-white">@{creatorHandle}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span>Entrega</span>
            <span className="text-white">Unlock imediato</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-500 px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-black transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Lock size={14} />
        {pending ? "Processando..." : `Desbloquear por ${priceLabel}`}
      </button>

      <p className="text-center text-[10px] uppercase tracking-[0.24em] text-brand-text-muted">
        PPV unitario; assinatura ou trial nunca substituem este unlock
      </p>
    </form>
  );
}
