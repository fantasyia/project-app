import Link from "next/link";
import { ArrowRight, Check, Crown, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { getCurrentUser } from "@/lib/actions/auth";

export const metadata = {
  title: "Planos e Precos | Fantasyia",
  description:
    "Escolha seu plano de acesso a Fantasyia. Assinatura de creators exclusivos com conteudo premium, DMs e muito mais.",
};

const PLACEHOLDER_PLANS = [
  {
    id: "plan_basic",
    name: "Basico",
    price: "19,90",
    period: "/mes",
    description: "Entrada leve para acompanhar creators, feed publico e comunidade.",
    icon: <Zap className="text-brand-500" size={18} strokeWidth={1.7} />,
    features: [
      "Feed publico completo",
      "Comentarios, likes e salvos",
      "Seguir creators favoritos",
      "Acesso ao blog editorial",
    ],
    cta: "Comecar agora",
    popular: false,
  },
  {
    id: "plan_premium",
    name: "Premium",
    price: "49,90",
    period: "/mes",
    description: "Assinatura recorrente com acesso premium e conversa direta.",
    icon: <Crown className="text-brand-500" size={18} strokeWidth={1.7} />,
    features: [
      "Tudo do Basico",
      "Conteudo premium desbloqueado",
      "Mensagens diretas com creators",
      "Prioridade em novos drops",
      "Entrada em experiencias exclusivas",
    ],
    cta: "Assinar premium",
    popular: true,
  },
  {
    id: "plan_vip",
    name: "VIP",
    price: "99,90",
    period: "/mes",
    description: "Camada de prioridade maxima com beneficios expandidos.",
    icon: <Sparkles className="text-brand-500" size={18} strokeWidth={1.7} />,
    features: [
      "Tudo do Premium",
      "PPV incluso como placeholder",
      "Badge VIP exclusiva",
      "Conteudo antecipado",
      "Suporte prioritario",
      "Convites especiais",
    ],
    cta: "Entrar no VIP",
    popular: false,
  },
];

export default async function PricingPage() {
  const user = await getCurrentUser();
  const appHref =
    user?.role === "creator"
      ? "/dashboard/creator/studio"
      : user?.role === "admin"
        ? "/dashboard/admin/overview"
        : user?.role === "affiliate"
          ? "/dashboard/affiliate/overview"
          : user
            ? "/dashboard/user/feed"
            : "/register";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(0,168,107,0.18),_transparent_38%),linear-gradient(180deg,_#080b09_0%,_#040404_58%,_#020202_100%)] text-white">
      <header className="sticky top-0 z-40 border-b border-white/8 bg-black/60 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-md items-center justify-between px-4 py-4">
          <Link href="/" className="text-lg font-thin uppercase tracking-[0.24em] text-white">
            Fantasy<span className="text-brand-500">ia</span>
          </Link>
          {user ? (
            <Link
              href={appHref}
              className="rounded-full bg-brand-500 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-black transition hover:bg-brand-400"
            >
              {user.role === "creator" ? "Studio" : user.role === "admin" ? "Painel" : "Feed"}
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-brand-500 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-black transition hover:bg-brand-400"
            >
              Entrar
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-4 pb-8 pt-5">
        <section className="rounded-[30px] border border-white/8 bg-[radial-gradient(circle_at_top_left,_rgba(0,255,156,0.12),_transparent_36%),rgba(255,255,255,0.03)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-brand-300">
            <Sparkles size={12} />
            Planos da plataforma
          </div>
          <h1 className="mt-5 text-4xl font-thin leading-none tracking-[-0.05em] text-white">
            Escolha seu nivel de acesso
          </h1>
          <p className="mt-4 text-sm leading-7 text-brand-text-muted">
            Tela mobile-first para decisao rapida no celular. Valores seguem demonstrativos ate a
            homologacao do gateway real.
          </p>
        </section>

        <section className="mt-4 rounded-[30px] border border-brand-500/15 bg-brand-500/[0.06] p-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-black/30 px-3 py-2 text-[10px] uppercase tracking-[0.22em] text-brand-300">
            <ShieldCheck size={12} />
            Pre-lancamento
          </div>
          <p className="mt-4 text-sm leading-7 text-brand-text-base">
            Assinatura e PPV ja funcionam localmente, mas os valores comerciais finais ainda serao
            atualizados na fase de pre-lancamento financeiro.
          </p>
        </section>

        <section className="mt-4 space-y-4">
          {PLACEHOLDER_PLANS.map((plan) => (
            <article
              key={plan.id}
              className={`overflow-hidden rounded-[28px] border p-5 ${
                plan.popular
                  ? "border-brand-500/30 bg-brand-500/[0.08] shadow-[0_0_34px_rgba(0,168,107,0.12)]"
                  : "border-white/8 bg-white/[0.03]"
              }`}
            >
              {plan.popular ? (
                <div className="mb-4 inline-flex items-center rounded-full bg-brand-500 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.22em] text-black">
                  Mais escolhido
                </div>
              ) : null}

              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/30">
                    {plan.icon}
                  </div>
                  <h2 className="mt-4 text-2xl font-light text-white">{plan.name}</h2>
                  <p className="mt-2 text-sm leading-6 text-brand-text-muted">{plan.description}</p>
                </div>

                <div className="text-right">
                  <span className="text-base font-light text-brand-text-muted">R$ </span>
                  <span className="text-4xl font-thin tracking-[-0.06em] text-white">{plan.price}</span>
                  <p className="text-sm font-light text-brand-text-muted">{plan.period}</p>
                </div>
              </div>

              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm leading-6 text-brand-text-base">
                    <Check size={15} className="mt-1 shrink-0 text-brand-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={user ? appHref : "/register"}
                className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-[11px] font-bold uppercase tracking-[0.22em] transition ${
                  plan.popular
                    ? "bg-brand-500 text-black hover:bg-brand-400"
                    : "border border-white/10 bg-black/30 text-white hover:bg-white/[0.05]"
                }`}
              >
                {user ? "Ir para o app" : plan.cta}
                <ArrowRight size={14} />
              </Link>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
