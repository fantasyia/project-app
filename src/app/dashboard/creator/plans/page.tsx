import { Crown } from "lucide-react";
import { getCreatorPlans } from "@/lib/actions/checkout";
import { PlansClient } from "./plans-client";

export const metadata = { title: "Meus Planos | Fantasyia" };

export type CreatorPlan = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  currency: string | null;
  is_active: boolean;
};

export default async function CreatorPlansPage() {
  const plans = (await getCreatorPlans()) as CreatorPlan[];
  const activePlans = plans.filter((plan) => plan.is_active).length;

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-brand-500/20 bg-brand-500/10 px-2.5 py-1 text-[10px] uppercase tracking-widest text-brand-400">
          <Crown size={12} />
          Monetização Recorrente
        </div>
        <h1 className="text-2xl font-semibold text-white">Camadas de Acesso</h1>
        <p className="text-sm text-brand-text-muted">
          Gerencie suas assinaturas ativas e controle quem acessa o quê.
        </p>
      </div>

      <div className="flex gap-3">
        <div className="flex flex-1 flex-col justify-center rounded-xl border border-white/5 bg-brand-surface-low px-4 py-3">
          <span className="text-xl font-medium text-white">{plans.length}</span>
          <span className="text-[10px] uppercase tracking-wider text-brand-text-muted">Criados</span>
        </div>
        <div className="flex flex-1 flex-col justify-center rounded-xl border border-brand-500/10 bg-brand-500/5 px-4 py-3">
          <span className="text-xl font-medium text-brand-400">{activePlans}</span>
          <span className="text-[10px] uppercase tracking-wider text-brand-text-muted">Ativos</span>
        </div>
      </div>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Interactive Client Component for listing and creating plans */}
      <PlansClient initialPlans={plans} />
    </div>
  );
}
