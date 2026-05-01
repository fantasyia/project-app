import { ShieldCheck, Wand2 } from "lucide-react";

export function GuardianPanel({
  seoChecks,
  onImproveText,
}: {
  seoChecks: Array<{ label: string; ok: boolean }>;
  onImproveText?: () => void;
}) {
  return (
    <section className="rounded-md border border-white/15 bg-[#2a2933] p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-cyan-300">
          <ShieldCheck size={14} />
          Guardiao SEO
        </div>
        <button type="button" className="rounded-sm border border-cyan-300/40 px-2 py-1 text-[10px] font-bold text-cyan-200">
          Auditar
        </button>
      </div>
      <div className="space-y-2">
        {seoChecks.map((check) => (
          <div key={check.label} className="flex items-center justify-between rounded-md border border-white/10 bg-[#1d1c24] px-3 py-2 text-xs">
            <span>{check.label}</span>
            <span className={check.ok ? "text-cyan-300" : "text-amber-300"}>{check.ok ? "OK" : "Ajustar"}</span>
          </div>
        ))}
      </div>
      <button type="button" onClick={onImproveText} className="mt-3 flex w-full items-center justify-center gap-2 rounded-sm bg-cyan-300 px-3 py-2 text-xs font-bold text-black">
        <Wand2 size={13} />
        Melhorar trecho selecionado
      </button>
    </section>
  );
}
