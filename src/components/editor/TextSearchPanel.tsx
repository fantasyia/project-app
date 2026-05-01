import { useState } from "react";
import { Search, Wand2, X } from "lucide-react";

export function TextSearchPanel({
  value,
  onChange,
  hitCount,
}: {
  value: string;
  onChange: (value: string) => void;
  hitCount: number;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="rounded-md border border-white/15 bg-[#2a2933] p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-200">
          <Search size={14} />
          Buscar no artigo
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase text-slate-400">{hitCount} resultados</span>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/[0.05] px-3 py-2 text-xs font-bold text-white"
          >
            <Wand2 size={13} />
            Popup
          </button>
        </div>
      </div>
      <div className="grid gap-2 md:grid-cols-[1fr_78px]">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Digite palavra ou frase..."
          className="w-full rounded-md border border-white/12 bg-[#1d1c24] px-3 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-cyan-300/60"
        />
        <button type="button" className="rounded-md bg-cyan-300 px-3 py-2 text-xs font-bold text-black">
          Buscar
        </button>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <button type="button" className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-2 text-xs font-bold text-slate-300">
          Anterior
        </button>
        <button type="button" className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-2 text-xs font-bold text-slate-300">
          Proxima
        </button>
        <button type="button" onClick={() => onChange("")} className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-2 text-xs font-bold text-white">
          Limpar
        </button>
      </div>
      <p className="mt-3 rounded-md border border-white/10 bg-[#1d1c24] px-3 py-2 text-[10px] leading-4 text-slate-400">
        Use o campo acima para localizar palavra ou frase no artigo e navegar pelo contexto.
      </p>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-xl rounded-lg border border-white/15 bg-[#24232c] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300">Busca no artigo</p>
                <h3 className="text-base font-bold text-white">Popup completo de localizacao</h3>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} className="rounded-md border border-white/15 p-2 text-slate-300">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3 p-4">
              <input
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder="Digite termo, entidade, anchor ou trecho..."
                className="admin-input"
              />
              <div className="grid grid-cols-3 gap-2">
                <button type="button" className="rounded-md border border-white/15 bg-white/[0.04] px-3 py-2 text-xs font-bold text-white">
                  Anterior
                </button>
                <button type="button" className="rounded-md border border-white/15 bg-white/[0.04] px-3 py-2 text-xs font-bold text-white">
                  Proxima
                </button>
                <button type="button" onClick={() => onChange("")} className="rounded-md border border-white/15 bg-white/[0.04] px-3 py-2 text-xs font-bold text-white">
                  Limpar
                </button>
              </div>
              <div className="rounded-md border border-white/12 bg-[#1d1c24] p-3 text-xs leading-5 text-slate-300">
                <strong className="text-cyan-200">{hitCount}</strong> resultado(s) encontrados. Use este popup para revisar anchors,
                termos LSI, entidades e trechos antes de aplicar link interno ou melhoria de texto.
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
