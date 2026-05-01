"use client";

import { useState, useTransition } from "react";
import { Plus, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { createCreatorPlan, deleteCreatorPlan, togglePlanActive } from "@/lib/actions/checkout";
import type { CreatorPlan } from "./page";

function formatPlanPrice(price: string) {
  const numericPrice = Number.parseFloat(price);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(Number.isFinite(numericPrice) ? numericPrice : 0);
}

export function PlansClient({ initialPlans }: { initialPlans: CreatorPlan[] }) {
  const [plans, setPlans] = useState(initialPlans);
  const [pending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);

  function handleCreate(formData: FormData) {
    startTransition(async () => {
      const result = await createCreatorPlan(formData);
      if (result?.error) {
        alert("Erro: " + result.error);
        return;
      }

      setShowForm(false);
      window.location.reload();
    });
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
    <div className="space-y-4">
      {/* Plans List */}
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
                  <h3 className="text-lg font-medium text-white">{plan.name}</h3>
                  <p className="mt-1 text-xs text-brand-text-muted">
                    {plan.description || "Sem descrição"}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-semibold text-white">
                    {formatPlanPrice(plan.price)}
                  </span>
                  <span className="text-xs text-brand-text-muted">/mês</span>
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
                    {plan.is_active ? (
                      <ToggleRight size={16} className="text-brand-400" />
                    ) : (
                      <ToggleLeft size={16} />
                    )}
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

      {/* Add Plan Form/Button */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="brand-gradient-btn flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-black shadow-lg"
        >
          <Plus size={16} />
          Criar Novo Plano
        </button>
      ) : (
        <form
          action={handleCreate}
          className="space-y-4 rounded-xl border border-white/10 bg-brand-surface-high p-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Novo Plano</h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-xs text-brand-text-muted hover:text-white"
            >
              Cancelar
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-brand-text-muted">Nome do plano</label>
              <input
                name="name"
                type="text"
                required
                placeholder="Ex: Premium"
                className="w-full rounded-lg border border-white/10 bg-brand-surface-low px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500/40"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-brand-text-muted">Descrição</label>
              <input
                name="description"
                type="text"
                placeholder="O que está incluído..."
                className="w-full rounded-lg border border-white/10 bg-brand-surface-low px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500/40"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-brand-text-muted">Preço mensal (R$)</label>
              <input
                name="price"
                type="text"
                required
                placeholder="29.90"
                className="w-full rounded-lg border border-white/10 bg-brand-surface-low px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500/40"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="brand-gradient-btn mt-2 flex w-full justify-center rounded-lg py-3 text-xs font-semibold text-black disabled:opacity-50"
          >
            {pending ? "Salvando..." : "Salvar Plano"}
          </button>
        </form>
      )}
    </div>
  );
}
