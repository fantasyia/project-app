import { ShieldAlert } from "lucide-react";

export function LinkHygienePanel({ hasSilo }: { hasSilo: boolean }) {
  const checks = [
    { label: "Links para pilar", ok: hasSilo },
    { label: "Anchors naturais", ok: false },
    { label: "Sem excesso externo", ok: true },
    { label: "Sem orfaos no hub", ok: hasSilo },
  ];

  return (
    <section className="rounded-md border border-white/15 bg-[#2a2933] p-3">
      <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-cyan-300">
        <ShieldAlert size={14} />
        Higiene de links
      </div>
      <div className="space-y-2">
        {checks.map((check) => (
          <div key={check.label} className="flex items-center justify-between rounded-md border border-white/10 bg-[#1d1c24] px-3 py-2 text-xs">
            <span>{check.label}</span>
            <span className={check.ok ? "text-cyan-300" : "text-amber-300"}>{check.ok ? "OK" : "Revisar"}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
