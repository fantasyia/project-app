import { Link2, Sparkles } from "lucide-react";

export function InternalLinksPanel({
  selectedSiloName,
  onOpenLinkDialog,
}: {
  selectedSiloName?: string | null;
  onOpenLinkDialog?: () => void;
}) {
  return (
    <section className="rounded-md border border-white/15 bg-[#2a2933] p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-cyan-300">
          <Link2 size={14} />
          Links internos IA
        </div>
        <span className="rounded-sm border border-orange-300/50 px-1.5 py-0.5 text-[9px] font-bold text-orange-200">
          IA
        </span>
      </div>
      <button
        type="button"
        onClick={onOpenLinkDialog}
        className="mb-3 flex w-full items-center justify-center gap-2 rounded-sm border border-cyan-300/50 bg-[#10262d] px-3 py-2 text-xs font-bold text-cyan-200"
      >
        <Sparkles size={13} />
        IA: sugerir links internos
      </button>
      <input
        placeholder="Filtrar sugestoes..."
        className="mb-3 w-full rounded-md border border-white/12 bg-[#1d1c24] px-3 py-2 text-xs text-white outline-none placeholder:text-white/35"
      />
      <p className="rounded-md border border-white/10 bg-[#1d1c24] p-3 text-xs leading-5 text-slate-400">
        {selectedSiloName
          ? `Sugestoes priorizam o silo ${selectedSiloName}, anchors naturais e relacao semantica.`
          : "Selecione um silo para gerar sugestoes por hierarquia e semantica."}
      </p>
    </section>
  );
}
