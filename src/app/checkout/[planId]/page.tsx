import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Lock, ShieldCheck, Sparkles } from "lucide-react";
import { getSubscriptionCheckoutDetails } from "@/lib/actions/checkout";
import { CheckoutForm } from "./checkout-form";

export const metadata = {
  title: "Checkout | Fantasyia",
  description: "Finalize sua assinatura na Fantasyia.",
};

function formatCurrency(price: string, currency: string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency || "BRL",
  }).format(Number.parseFloat(price || "0"));
}

function buildPlanHighlights(description: string | null, billingLabel: string) {
  const fromDescription = (description || "")
    .split(/\n|[.;]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);

  if (fromDescription.length > 0) {
    return fromDescription;
  }

  return [
    `Acesso ${billingLabel.toLowerCase()} ao conteudo premium deste creator.`,
    "Posts premium liberados assim que a confirmacao for concluida.",
    "PPV continua separado: conteudos avulsos sempre exigem unlock proprio.",
  ];
}

export default async function CheckoutPage({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = await params;
  const checkout = await getSubscriptionCheckoutDetails(planId);

  if (!checkout) {
    return (
      <div className="min-h-screen bg-black text-white px-6 py-16">
        <div className="mx-auto max-w-md rounded-[32px] border border-white/10 bg-white/[0.03] p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
          <p className="text-[11px] uppercase tracking-[0.35em] text-brand-text-muted">Checkout</p>
          <h1 className="mt-4 text-3xl font-light tracking-tight">Plano indisponivel</h1>
          <p className="mt-3 text-sm leading-6 text-brand-text-muted">
            O link pode ter expirado ou este plano nao esta mais ativo no momento.
          </p>
          <Link
            href="/dashboard/user/feed"
            className="mt-8 inline-flex items-center gap-2 rounded-full border border-brand-500/30 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-brand-400 transition hover:border-brand-500 hover:text-brand-300"
          >
            <ArrowLeft size={14} />
            Voltar para o app
          </Link>
        </div>
      </div>
    );
  }

  const { plan, creator, viewer } = checkout;
  const planHighlights = buildPlanHighlights(plan.description, plan.billingCycle.label);
  const priceLabel = formatCurrency(plan.price, plan.currency);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(0,168,107,0.24),_transparent_34%),linear-gradient(180deg,_#080b09_0%,_#050505_48%,_#020202_100%)] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-4">
        <header className="sticky top-0 z-40 mb-4 rounded-full border border-white/10 bg-black/55 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <Link
              href={`/${creator.handle}`}
              className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-brand-text-muted transition hover:text-brand-300"
            >
              <ArrowLeft size={14} />
              Perfil
            </Link>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-300">
              <Lock size={12} />
              Checkout Seguro
            </div>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-5">
          <section className="overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.04] shadow-[0_24px_90px_rgba(0,0,0,0.42)]">
            <div className="relative overflow-hidden border-b border-white/8 px-5 pb-7 pt-6">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.14),_transparent_36%),radial-gradient(circle_at_bottom_right,_rgba(0,168,107,0.22),_transparent_34%)]" />
              <div className="relative flex flex-col gap-5">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-text-muted">
                  <Sparkles size={12} className="text-brand-400" />
                  Pass premium
                </div>

                <div className="flex items-start gap-4">
                  <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-white/10 bg-brand-surface-high">
                    {creator.avatar_url ? (
                      <Image src={creator.avatar_url} alt={creator.display_name} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-brand-500/20 text-xl font-semibold text-brand-300">
                        {creator.display_name?.[0]?.toUpperCase() || "F"}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] uppercase tracking-[0.3em] text-brand-text-muted">Assinatura</p>
                    <h1 className="mt-2 text-3xl font-light tracking-tight">{plan.name}</h1>
                    <p className="mt-2 text-sm text-brand-text-muted">
                      {creator.display_name} <span className="text-white/30">/</span> @{creator.handle}
                    </p>
                  </div>
                </div>

              <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-brand-text-muted">Valor</p>
                    <p className="mt-3 text-2xl font-light tracking-tight text-brand-300">{priceLabel}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-brand-text-muted">Ciclo</p>
                    <p className="mt-3 text-xl font-light tracking-tight">{plan.billingCycle.label}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-brand-text-muted">Entrega</p>
                    <p className="mt-3 text-xl font-light tracking-tight">Imediata</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6 px-5 py-6">
              <div className="rounded-[28px] border border-white/8 bg-black/30 p-5">
                <p className="text-[10px] uppercase tracking-[0.32em] text-brand-text-muted">O que entra</p>
                <div className="mt-4 space-y-3">
                  {planHighlights.map((highlight) => (
                    <div key={highlight} className="flex items-start gap-3 text-sm leading-6 text-brand-text-base">
                      <ShieldCheck size={16} className="mt-1 flex-shrink-0 text-brand-400" />
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-3">
                <div className="rounded-2xl border border-brand-500/20 bg-brand-500/10 p-4">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-brand-300">Acesso premium</p>
                  <p className="mt-2 text-sm leading-6 text-brand-text-base">
                    A assinatura libera conteudos premium recorrentes deste creator assim que confirmada.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-brand-text-muted">Acesso avulso</p>
                  <p className="mt-2 text-sm leading-6 text-brand-text-base">
                    Conteudos PPV continuam como compras avulsas e nao entram no acesso da assinatura.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-black/35 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={16} className="mt-1 flex-shrink-0 text-brand-400" />
                  <p className="text-sm leading-6 text-brand-text-muted">
                    {viewer.isSubscribed
                      ? "Voce ja tem uma assinatura ativa com este creator. Se quiser, pode voltar ao perfil e consumir o conteudo premium agora."
                      : viewer.isOwner
                        ? "Este plano pertence ao seu proprio perfil. A confirmacao fica bloqueada para evitar autoassinatura."
                        : "Checkout mobile-first com confirmacao protegida e acesso premium liberado ao concluir."}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[#070909]/90 shadow-[0_24px_90px_rgba(0,0,0,0.42)]">
            <div className="border-b border-white/8 px-5 pb-5 pt-6">
              <p className="text-[10px] uppercase tracking-[0.32em] text-brand-text-muted">Confirmacao</p>
              <h2 className="mt-3 text-2xl font-light tracking-tight">Finalize sua assinatura</h2>
              <p className="mt-2 text-sm leading-6 text-brand-text-muted">
                Revise os dados e confirme para liberar o acesso premium deste creator.
              </p>
            </div>

            <div className="px-5 py-6">
              <CheckoutForm
                creatorHandle={creator.handle}
                creatorId={creator.id}
                creatorName={creator.display_name}
                isAuthenticated={viewer.isAuthenticated}
                isOwner={viewer.isOwner}
                isSubscribed={viewer.isSubscribed}
                planCycleLabel={plan.billingCycle.label}
                planId={plan.id}
                planName={plan.name}
                planPrice={plan.price}
                priceLabel={priceLabel}
              />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
