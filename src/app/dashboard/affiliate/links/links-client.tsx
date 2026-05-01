"use client";

import { useState, useTransition } from "react";
import { Check, Copy, Link as LinkIcon } from "lucide-react";
import { generateAffiliateLink } from "@/lib/actions/affiliate";

type AffiliateCreator = {
  id: string;
  handle?: string | null;
  display_name?: string | null;
};

export function LinksClient({ creators }: { creators: AffiliateCreator[] }) {
  const [pending, startTransition] = useTransition();
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState("");

  function handleGenerate() {
    startTransition(async () => {
      const result = await generateAffiliateLink(undefined, selectedCreator || undefined);
      if (result?.url) {
        setGeneratedUrl(result.url);
      }
    });
  }

  function handleCopy() {
    if (!generatedUrl) return;
    navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="w-full space-y-6 px-4 py-5 pb-24">
      <section className="rounded-[32px] border border-white/8 bg-white/[0.035] p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-brand-300">Aquisicao</p>
        <h1 className="mt-3 text-4xl font-thin tracking-[-0.05em] text-white">
          Gerar <span className="text-brand-500">links</span>
        </h1>
        <p className="mt-3 text-sm leading-6 text-brand-text-muted">
          Crie links rastreaveis para plataforma geral ou para creators especificos.
        </p>
      </section>

      <section className="space-y-5 rounded-[28px] border border-white/8 bg-black/30 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-300">
            <LinkIcon size={18} />
          </div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-white">Link UTM</h2>
        </div>

        <label className="grid gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-text-muted">
            Creator (opcional)
          </span>
          <select
            value={selectedCreator}
            onChange={(event) => setSelectedCreator(event.target.value)}
            className="h-12 rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none transition focus:border-brand-500/40"
          >
            <option value="">Plataforma geral</option>
            {creators.map((creator) => (
              <option key={creator.id} value={creator.id}>
                @{creator.handle || "sem-handle"} - {creator.display_name || "Creator"}
              </option>
            ))}
          </select>
        </label>

        <button
          onClick={handleGenerate}
          disabled={pending}
          className="w-full rounded-2xl bg-brand-500 px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.24em] text-black transition hover:bg-brand-400 disabled:opacity-60"
        >
          {pending ? "Gerando..." : "Gerar link rastreavel"}
        </button>
      </section>

      {generatedUrl && (
        <section className="rounded-[28px] border border-brand-500/20 bg-brand-500/10 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-300">Link ativo</p>
          <code className="mt-3 block break-all rounded-2xl border border-white/10 bg-black/30 px-3 py-3 text-xs text-white">
            {generatedUrl}
          </code>
          <button
            onClick={handleCopy}
            className="mt-3 inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-black/25 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-300"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copiado" : "Copiar"}
          </button>
        </section>
      )}
    </div>
  );
}
