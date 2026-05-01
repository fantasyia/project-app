"use client";

import { useState } from "react";
import type { BlogSiloRecord } from "@/lib/blog/types";

type InspectorTab = "post" | "seo" | "review" | "eeat" | "publish";

const tabLabels: Record<InspectorTab, string> = {
  post: "Post",
  seo: "SEO / KGR",
  review: "Revisao",
  eeat: "E-E-A-T",
  publish: "Publicar",
};

export function EditorInspector({
  silos,
  selectedSiloId,
  onSiloChange,
  fields,
  pending,
  error,
  mode,
}: {
  silos: BlogSiloRecord[];
  selectedSiloId: string;
  onSiloChange: (value: string) => void;
  fields: {
    siloRole: string;
    setSiloRole: (value: string) => void;
    siloGroup: string;
    setSiloGroup: (value: string) => void;
    keyword: string;
    setKeyword: (value: string) => void;
    metaTitle: string;
    setMetaTitle: (value: string) => void;
    metaDescription: string;
    setMetaDescription: (value: string) => void;
    canonicalPath: string;
    setCanonicalPath: (value: string) => void;
    schemaType: string;
    setSchemaType: (value: string) => void;
    intent: string;
    setIntent: (value: string) => void;
    category: string;
    setCategory: (value: string) => void;
    tags: string;
    setTags: (value: string) => void;
    title: string;
    setTitle: (value: string) => void;
    excerpt: string;
    setExcerpt: (value: string) => void;
    coverPreview: string;
    status?: string | null;
  };
  pending: boolean;
  error: string | null;
  mode: "create" | "edit";
}) {
  const [activeTab, setActiveTab] = useState<InspectorTab>("post");

  return (
    <aside className="h-full overflow-y-auto border-l border-white/10 bg-[#24232c]">
      <div className="grid grid-cols-5 gap-1 border-b border-white/10 p-2">
        {(["post", "seo", "review", "eeat", "publish"] as InspectorTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-md px-2 py-3 text-[10px] font-bold uppercase ${
              activeTab === tab ? "bg-[#102a32] text-cyan-200 ring-1 ring-cyan-300/50" : "bg-white/[0.04] text-slate-300"
            }`}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      <div className="space-y-3 p-3">
        {activeTab === "post" ? (
          <>
            <Field label="Silo">
              <select value={selectedSiloId} onChange={(event) => onSiloChange(event.target.value)} className="admin-input">
                <option value="">Sem silo</option>
                {silos.map((silo) => (
                  <option key={silo.id} value={silo.id}>
                    {silo.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Titulo do post (H1)">
              <input value={fields.title} onChange={(event) => fields.setTitle(event.target.value)} className="admin-input font-bold" />
            </Field>
            <Field label="Imagem de capa">
              {fields.coverPreview ? (
                <div className="relative mb-3 aspect-[16/8] overflow-hidden rounded-md border border-white/10 bg-black/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={fields.coverPreview} alt="Capa atual" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="mb-3 flex aspect-[16/8] items-center justify-center rounded-md border border-dashed border-white/15 bg-black/25 text-xs text-slate-500">
                  Sem capa definida
                </div>
              )}
              <p className="text-[10px] text-slate-500">Clique na imagem central para trocar.</p>
            </Field>
            <Field label="Lead / introducao">
              <textarea value={fields.excerpt} onChange={(event) => fields.setExcerpt(event.target.value)} rows={4} className="admin-input" />
            </Field>
            <Field label="Hierarquia">
              <select value={fields.siloRole} onChange={(event) => fields.setSiloRole(event.target.value)} className="admin-input">
                <option value="PILLAR">Pilar</option>
                <option value="SUPPORT">Suporte</option>
                <option value="AUX">Auxiliar</option>
              </select>
            </Field>
            <Field label="Grupo editorial">
              <input value={fields.siloGroup} onChange={(event) => fields.setSiloGroup(event.target.value)} className="admin-input" />
            </Field>
            <Field label="Categoria">
              <input value={fields.category} onChange={(event) => fields.setCategory(event.target.value)} className="admin-input" />
            </Field>
            <Field label="Tags">
              <input value={fields.tags} onChange={(event) => fields.setTags(event.target.value)} className="admin-input" />
            </Field>
            <Field label="Midia do post">
              <div className="space-y-2">
                {[fields.coverPreview, fields.coverPreview, fields.coverPreview].filter(Boolean).map((src, index) => (
                  <div key={`${src}-${index}`} className="grid grid-cols-[44px_1fr_auto] items-center gap-2 rounded-md border border-white/10 bg-[#252530] p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="h-10 w-10 rounded object-cover" />
                    <input value={index === 0 ? fields.title : `${fields.title} imagem`} readOnly className="rounded border border-white/10 bg-[#1d1c24] px-2 py-2 text-xs text-white" />
                    <button type="button" className="rounded bg-cyan-300/15 px-2 py-1 text-[10px] font-bold text-cyan-200">
                      Inserir
                    </button>
                  </div>
                ))}
              </div>
            </Field>
          </>
        ) : null}

        {activeTab === "seo" ? (
          <>
            <Field label="Keyword alvo">
              <input value={fields.keyword} onChange={(event) => fields.setKeyword(event.target.value)} className="admin-input" />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Metric label="Meta title" value={`${fields.metaTitle.length}/65`} />
              <Metric label="Description" value={`${fields.metaDescription.length}/160`} />
            </div>
            <Field label="Intent">
              <select value={fields.intent} onChange={(event) => fields.setIntent(event.target.value)} className="admin-input">
                <option value="informational">Informational</option>
                <option value="commercial">Commercial</option>
                <option value="comparison">Comparison</option>
              </select>
            </Field>
            <Field label="Meta title">
              <input value={fields.metaTitle} onChange={(event) => fields.setMetaTitle(event.target.value)} className="admin-input" />
            </Field>
            <Field label="Meta description">
              <textarea value={fields.metaDescription} onChange={(event) => fields.setMetaDescription(event.target.value)} rows={5} className="admin-input" />
            </Field>
            <Field label="Canonical">
              <input value={fields.canonicalPath} onChange={(event) => fields.setCanonicalPath(event.target.value)} className="admin-input font-mono text-xs" />
            </Field>
            <Field label="Schema">
              <select value={fields.schemaType} onChange={(event) => fields.setSchemaType(event.target.value)} className="admin-input">
                <option value="article">Article</option>
                <option value="blogposting">BlogPosting</option>
                <option value="howto">HowTo</option>
                <option value="faq">FAQ</option>
              </select>
            </Field>
          </>
        ) : null}

        {activeTab === "review" ? (
          <>
            <button type="button" className="w-full rounded-md bg-cyan-300 px-4 py-3 text-xs font-bold uppercase text-black">
              Rodar analise SERP do post
            </button>
            <Note title="SERP do Post" text="Comparar titulo, intencao, lacunas de H2/H3 e concorrentes antes de publicar." />
            <Note title="Duplicacao interna" text="Verifique canibalizacao dentro do silo e ajuste links internos." />
            <Note title="Schema e canonical" text={`Schema: ${fields.schemaType}. Canonical: ${fields.canonicalPath || "pendente"}.`} />
            <Checklist items={["Review manual", "Meta revisada", "Links internos", "Imagem com alt", "CTA final"]} />
          </>
        ) : null}

        {activeTab === "eeat" ? (
          <>
            <Field label="Autor">
              <input defaultValue="Equipe FantasyIA" className="admin-input" />
            </Field>
            <Field label="Revisor / especialista">
              <input placeholder="Nome do revisor" className="admin-input" />
            </Field>
            <Field label="Fontes">
              <textarea rows={4} placeholder="URLs ou fontes de autoridade, uma por linha." className="admin-input" />
            </Field>
            <Note title="Autoridade" text="Registrar autor, fontes, revisao e riscos. Para FantasyIA, manter clareza sobre IA e conteudo visual ficticio quando aplicavel." />
            <Note title="Fontes" text="Usar fontes verificaveis quando houver afirmacoes tecnicas, legais, financeiras ou de mercado." />
          </>
        ) : null}

        {activeTab === "publish" ? (
          <>
            <div className="rounded-md border border-white/12 bg-[#1d1c24] p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Status atual</p>
              <p className="mt-2 text-lg font-bold text-white">{fields.status || "draft"}</p>
            </div>
            <ReadinessChecklist
              items={[
                { label: "Titulo H1 definido", ok: Boolean(fields.title.trim()) },
                { label: "Imagem de capa definida", ok: Boolean(fields.coverPreview) },
                { label: "Lead / introducao preenchido", ok: Boolean(fields.excerpt.trim()) },
                { label: "Silo editorial definido", ok: Boolean(selectedSiloId) },
                { label: "Keyword principal definida", ok: Boolean(fields.keyword.trim()) },
                { label: "Meta description pronta", ok: fields.metaDescription.length >= 120 && fields.metaDescription.length <= 160 },
                { label: "Canonical revisado", ok: Boolean(fields.canonicalPath.trim()) },
                { label: "Tags / entidades preenchidas", ok: Boolean(fields.tags.trim()) },
              ]}
            />
            {error ? <div className="rounded-md border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</div> : null}
            <button
              form="miniwordpress-editor-form"
              type="submit"
              disabled={pending}
              className="w-full rounded-md bg-cyan-300 px-4 py-3 text-xs font-bold uppercase text-black shadow-[0_0_18px_rgba(103,232,249,0.25)] disabled:opacity-60"
            >
              {pending ? "Salvando..." : mode === "edit" ? "Salvar post" : "Criar post"}
            </button>
            <Note title="Workflow" text="Depois de salvar, publique pelo cockpit de conteudo ou continue editando o post." />
          </>
        ) : null}
      </div>
    </aside>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block rounded-md border border-white/12 bg-[#1d1c24] p-3">
      <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</span>
      {children}
    </label>
  );
}

function Note({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-md border border-white/12 bg-[#1d1c24] p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-300">{title}</p>
      <p className="mt-2 text-xs leading-5 text-slate-300">{text}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/12 bg-[#1d1c24] p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-bold text-white">{value}</p>
    </div>
  );
}

function Checklist({ items }: { items: string[] }) {
  return (
    <div className="rounded-md border border-white/12 bg-[#1d1c24] p-3">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-300">Checklist de revisao</p>
      <div className="space-y-2">
        {items.map((item) => (
          <label key={item} className="flex items-center gap-2 text-xs text-slate-300">
            <input type="checkbox" className="h-4 w-4" />
            {item}
          </label>
        ))}
      </div>
    </div>
  );
}

function ReadinessChecklist({ items }: { items: Array<{ label: string; ok: boolean }> }) {
  const done = items.filter((item) => item.ok).length;

  return (
    <div className="rounded-md border border-white/12 bg-[#1d1c24] p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-300">Checklist Mini WordPress</p>
        <span className="rounded border border-white/12 bg-white/[0.04] px-2 py-1 text-[10px] font-bold text-slate-300">
          {done}/{items.length}
        </span>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-black/15 px-3 py-2 text-xs">
            <span className="text-slate-300">{item.label}</span>
            <span className={item.ok ? "text-cyan-300" : "text-amber-300"}>{item.ok ? "OK" : "Pendente"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
