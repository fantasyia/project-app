"use client";

import { useState } from "react";
import type { BlogArticleRecord, BlogSiloRecord } from "@/lib/blog/types";
import { SiloMapPanel } from "./SiloMapPanel";

type Tab = "metadata" | "overview" | "links" | "cannibalization" | "serp";

export function SiloDetailPanel({ silo, articles }: { silo: BlogSiloRecord; articles: BlogArticleRecord[] }) {
  const [tab, setTab] = useState<Tab>("links");
  const groups = silo.silo_groups || [];

  return (
    <div className="space-y-4 p-4">
      <div className="rounded-lg border border-white/12 bg-[#282832] p-2">
        <div className="grid grid-cols-5 gap-2">
          {[
            ["metadata", "Metadados"],
            ["overview", "Visao Geral"],
            ["links", "Mapa de Links"],
            ["cannibalization", "Canibalizacao"],
            ["serp", "SERP"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key as Tab)}
              className={`rounded-md border px-3 py-3 text-xs font-bold ${
                tab === key ? "border-cyan-300/60 bg-[#102a32] text-cyan-200" : "border-white/15 bg-white/[0.04] text-slate-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === "metadata" ? (
        <div className="rounded-lg border border-white/12 bg-[#303039] p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Nome" value={silo.name} />
            <Field label="Slug" value={silo.slug} mono />
          </div>
          <div className="mt-4 rounded-md border border-white/12 bg-[#252530] px-4 py-3 text-xs font-bold uppercase text-cyan-300">
            Campos raros: descricao, SEO, hero e pilar
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Kpi label="Menu order" value={String(silo.menu_order || 0)} />
            <Kpi label="Hub publico" value={silo.is_active ? "Ativo" : "Inativo"} />
            <Kpi label="Menu publico" value={silo.show_in_navigation ? "Visivel" : "Oculto"} />
          </div>
        </div>
      ) : null}

      {tab === "overview" ? (
        <div className="grid gap-4 md:grid-cols-4">
          <Kpi label="Posts" value={String(articles.length)} />
          <Kpi label="Pilares" value={String(articles.filter((article) => article.silo_role === "PILLAR").length)} />
          <Kpi label="Suportes" value={String(articles.filter((article) => article.silo_role !== "PILLAR").length)} />
          <Kpi label="Grupos" value={String(groups.length)} />
        </div>
      ) : null}

      {tab === "links" ? <SiloMapPanel silo={silo} articles={articles} /> : null}

      {tab === "cannibalization" ? (
        <div className="rounded-lg border border-white/12 bg-[#303039] p-5 text-sm text-slate-300">
          Nenhum par critico calculado localmente. A tabela `link_audits` e as analises de SERP entram pela migration Mini WordPress.
        </div>
      ) : null}

      {tab === "serp" ? (
        <div className="rounded-lg border border-white/12 bg-[#303039] p-5 text-sm text-slate-300">
          SERP pronto para conectar Google CSE em `google_cse_settings`.
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-bold uppercase text-slate-400">{label}</span>
      <input readOnly value={value} className={`w-full rounded-md border border-white/12 bg-[#1d1c24] px-3 py-3 text-sm text-white ${mono ? "font-mono" : ""}`} />
    </label>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/12 bg-[#303039] p-4">
      <p className="text-[10px] font-bold uppercase text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
