"use client";

import { useState, useTransition } from "react";
import { Gem, Plus, Sparkles, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import {
  createCreatorPlan,
  createCreatorPromotion,
  deleteCreatorPlan,
  togglePlanActive,
  updateCreatorPricingSettings,
} from "@/lib/actions/checkout";
import type { CreatorPlan, CreatorPricingSettings } from "./page";

function formatPlanPrice(price: string) {
  const numericPrice = Number.parseFloat(price);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(Number.isFinite(numericPrice) ? numericPrice : 0);
}

function planKeyLabel(planKey?: string | null) {
  return planKey === "emerald" ? "Esmeralda" : "Premium";
}

export function PlansClient({
  initialPlans,
  initialSettings,
}: {
  initialPlans: CreatorPlan[];
  initialSettings: CreatorPricingSettings;
}) {
  const [plans, setPlans] = useState(initialPlans);
  const [pending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);

  function handleAction(action: (formData: FormData) => Promise<{ error?: string } | undefined>) {
    return (formData: FormData) => {
      startTransition(async () => {
        const result = await action(formData);
        if (result?.error) {
          alert("Erro: " + result.error);
          return;
        }

        window.location.reload();
      });
    };
  }

  function handleToggle(planId: string, currentActive: boolean) {
    startTransition(async () => {
      const result = await togglePlanActive(planId, !currentActive);
      if (result?.error) {
        alert("Erro: " + result.error);
        return;
      }

      setPlans((prev) =>
        prev.map((plan) => (plan.id === planId ? { ...plan, is_active: !currentActive } : plan))
      );
    });
  }

  function handleDelete(planId: string) {
    if (!confirm("Excluir este plano permanentemente?")) return;

    startTransition(async () => {
      const result = await deleteCreatorPlan(planId);
      if (result?.error) {
        alert("Erro: " + result.error);
        return;
      }

      setPlans((prev) => prev.filter((plan) => plan.id !== planId));
    });
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[24px] border border-white/8 bg-brand-surface-lowest p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-brand-500/20 bg-brand-500/10 text-brand-400">
            <Sparkles size={16} />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-400">PPV padrao</p>
            <h2 className="text-lg font-medium text-white">Valor base dos seus PPVs</h2>
          </div>
        </div>
        <form action={handleAction(updateCreatorPricingSettings)} className="mt-4 flex gap-2">
          <input
            name="defaultPpvPrice"
            defaultValue={initialSettings.defaultPpvPrice}
            inputMode="decimal"
            placeholder="29.90"
            className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-brand-500/40"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-2xl bg-brand-500 px-4 text-xs font-semibold text-black disabled:opacity-50"
          >
            Salvar
          </button>
        </form>
      </section>

      {plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-brand-surface-low py-10">
          <p className="text-sm text-brand-text-muted">Nenhum plano criado ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`flex flex-col gap-3 rounded-xl border p-4 transition-all ${
                plan.is_active
                  ? "border-brand-500/20 bg-brand-surface-low shadow-[inset_0_0_20px_rgba(0,168,107,0.03)]"
                  : "border-white/5 bg-brand-surface-lowest opacity-75"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/20 bg-brand-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-brand-400">
                    <Gem size={11} />
                    {planKeyLabel(plan.plan_key)}
                  </span>
                  <h3 className="mt-3 text-lg font-medium text-white">{plan.name}</h3>
                  <p className="mt-1 text-xs text-brand-text-muted">
                    {plan.description || "Sem descricao"}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-semibold text-white">
                    {formatPlanPrice(plan.price)}
                  </span>
                  <span className="text-xs text-brand-text-muted">/mes</span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/5 pt-3">
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                    plan.is_active ? "text-brand-400" : "text-brand-text-muted"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${plan.is_active ? "bg-brand-500" : "bg-white/20"}`} />
                  {plan.is_active ? "Ativo" : "Inativo"}
                </span>

                <div className="flex gap-4">
                  <button
                    onClick={() => handleToggle(plan.id, plan.is_active)}
                    disabled={pending}
                    className="flex items-center gap-1.5 text-xs text-brand-text-muted hover:text-white disabled:opacity-50"
                  >
                    {plan.is_active ? <ToggleRight size={16} className="text-brand-400" /> : <ToggleLeft size={16} />}
                    {plan.is_active ? "Desativar" : "Ativar"}
                  </button>

                  <button
                    onClick={() => handleDelete(plan.id)}
                    disabled={pending}
                    className="text-red-400/50 hover:text-red-400 disabled:opacity-50"
                    title="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="brand-gradient-btn flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-black shadow-lg"
        >
          <Plus size={16} />
          Criar plano Premium ou Esmeralda
        </button>
      ) : (
        <form action={handleAction(createCreatorPlan)} className="space-y-4 rounded-xl border border-white/10 bg-brand-surface-high p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Novo plano</h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-xs text-brand-text-muted hover:text-white">
              Cancelar
            </button>
          </div>

          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-brand-text-muted">Camada</span>
              <select
                name="planKey"
                className="w-full rounded-lg border border-white/10 bg-brand-surface-low px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500/40"
              >
                <option value="premium">Premium</option>
                <option value="emerald">Esmeralda</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-brand-text-muted">Nome do plano</span>
              <input
                name="name"
                type="text"
                required
                placeholder="Ex: Premium mensal"
                className="w-full rounded-lg border border-white/10 bg-brand-surface-low px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500/40"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-brand-text-muted">Descricao</span>
              <input
                name="description"
                type="text"
                placeholder="O que esta incluido..."
                className="w-full rounded-lg border border-white/10 bg-brand-surface-low px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500/40"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-brand-text-muted">Preco mensal (R$)</span>
              <input
                name="price"
                type="text"
                required
                placeholder="29.90"
                className="w-full rounded-lg border border-white/10 bg-brand-surface-low px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500/40"
              />
            </label>
          </div>

          <button type="submit" disabled={pending} className="brand-gradient-btn mt-2 flex w-full justify-center rounded-lg py-3 text-xs font-semibold text-black disabled:opacity-50">
            {pending ? "Salvando..." : "Salvar plano"}
          </button>
        </form>
      )}

      <section className="rounded-[24px] border border-white/8 bg-brand-surface-lowest p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-400">Promocoes do creator</p>
        <h2 className="mt-2 text-lg font-medium text-white">Liberar PPV ou chat para Plano Básico</h2>
        <p className="mt-1 text-xs leading-5 text-brand-text-muted">
          A campanha dura 3 meses, com desconto de 5% a 50% e limite de usuarios.
        </p>

        <form action={handleAction(createCreatorPromotion)} className="mt-4 space-y-3">
          <select name="promotionType" className="w-full rounded-lg border border-white/10 bg-brand-surface-low px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500/40">
            <option value="basic_ppv">Liberar PPV promocional para Plano Básico</option>
            <option value="basic_chat">Liberar chat promocional para Plano Básico</option>
          </select>
          <input name="title" placeholder="Nome da campanha" className="w-full rounded-lg border border-white/10 bg-brand-surface-low px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500/40" />
          <div className="grid grid-cols-2 gap-2">
            <input name="discountPercent" type="number" min={5} max={50} defaultValue={10} className="rounded-lg border border-white/10 bg-brand-surface-low px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500/40" />
            <input name="userLimit" type="number" min={1} defaultValue={10} className="rounded-lg border border-white/10 bg-brand-surface-low px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500/40" />
          </div>
          <button type="submit" disabled={pending} className="w-full rounded-lg border border-brand-500/30 bg-brand-500/10 py-3 text-xs font-semibold text-brand-300 disabled:opacity-50">
            Criar promocao
          </button>
        </form>

        {initialSettings.promotions.length > 0 ? (
          <div className="mt-4 space-y-2">
            {initialSettings.promotions.map((promotion) => (
              <div key={promotion.id} className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2">
                <p className="text-sm text-white">{promotion.title}</p>
                <p className="text-[11px] text-brand-text-muted">
                  {promotion.promotion_type === "basic_chat" ? "Chat" : "PPV"} · {promotion.discount_percent}% · limite {promotion.user_limit} · ate {new Date(promotion.ends_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
