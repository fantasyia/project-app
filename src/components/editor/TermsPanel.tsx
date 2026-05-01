import { Tags } from "lucide-react";

export function TermsPanel({ onAddTerm }: { onAddTerm?: (term: string) => void }) {
  const terms = [
    { term: "arte IA", type: "entidade" },
    { term: "creator", type: "entidade" },
    { term: "assinatura", type: "relacao" },
    { term: "PPV", type: "termo tecnico" },
    { term: "conteudo premium", type: "sinonimo" },
    { term: "comunidade", type: "relacao" },
  ];

  return (
    <section className="rounded-md border border-white/15 bg-[#2a2933] p-3">
      <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-cyan-300">
        <Tags size={14} />
        Termos / LSI IA
      </div>
      <div className="mb-3 grid grid-cols-[1fr_auto] gap-2">
        <input
          placeholder="Keyword, entidade ou fonte..."
          className="rounded-md border border-white/12 bg-[#1d1c24] px-3 py-2 text-xs text-white outline-none placeholder:text-white/35"
        />
        <button type="button" className="rounded-md bg-cyan-300 px-3 py-2 text-xs font-bold text-black">
          Gerar
        </button>
      </div>
      <div className="space-y-2">
        {terms.map((item) => (
          <button
            key={item.term}
            type="button"
            onClick={() => onAddTerm?.(item.term)}
            className="flex w-full items-center justify-between rounded-md border border-white/10 bg-[#1d1c24] px-3 py-2 text-left text-xs text-slate-200 hover:border-cyan-300/45"
          >
            <span>{item.term}</span>
            <span className="text-[10px] uppercase text-slate-500">{item.type}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
