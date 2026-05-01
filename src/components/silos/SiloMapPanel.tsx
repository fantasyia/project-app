import type { BlogArticleRecord, BlogSiloRecord } from "@/lib/blog/types";

export function SiloMapPanel({ articles }: { silo: BlogSiloRecord; articles: BlogArticleRecord[] }) {
  const pillar = articles.find((article) => article.silo_role === "PILLAR") || articles[0];
  const support = articles.filter((article) => article.id !== pillar?.id).slice(0, 5);

  return (
    <div className="rounded-lg border border-white/12 bg-[#303039] p-4">
      <div className="mb-4 flex items-center justify-between rounded-md bg-white/10 px-4 py-3">
        <label className="flex items-center gap-2 text-sm text-white">
          <input type="checkbox" className="h-4 w-4" /> Ocultar orfaos ({Math.max(0, articles.length - support.length - (pillar ? 1 : 0))})
        </label>
        <div className="text-sm font-bold text-rose-300">Saude: {pillar ? "72%" : "49%"} <span className="ml-2 rounded-full border border-amber-300/30 px-2 py-1 text-[10px] text-amber-300">PENDENCIAS</span></div>
      </div>

      <div className="relative min-h-[560px] overflow-hidden rounded-lg border border-white/10 bg-[radial-gradient(circle,rgba(244,114,182,0.24)_1px,transparent_1px)] [background-size:22px_22px]">
        {pillar ? (
          <Node article={pillar} className="absolute left-1/2 top-14 w-72 -translate-x-1/2 border-cyan-300" label="PILAR" />
        ) : null}
        <div className="absolute left-[20%] right-[20%] top-64 h-px bg-cyan-300/60" />
        {support.map((article, index) => (
          <Node
            key={article.id}
            article={article}
            className="absolute top-80 w-64 border-yellow-300"
            style={{ left: `${6 + index * 18}%` }}
            label={`SUPORTE ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

function Node({
  article,
  label,
  className,
  style,
}: {
  article: BlogArticleRecord;
  label: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div style={style} className={`rounded-lg border-2 bg-[#4a4a53] p-3 shadow-xl ${className || ""}`}>
      <span className="rounded-full bg-cyan-300 px-3 py-1 text-[10px] font-bold text-black">{label}</span>
      <h3 className="mt-4 line-clamp-2 text-sm font-bold uppercase text-cyan-200">{article.title}</h3>
      <p className="mt-3 truncate rounded bg-[#252530] px-3 py-2 font-mono text-xs text-cyan-100">/{article.slug}</p>
      <div className="mt-3 flex justify-between text-xs font-bold text-slate-300">
        <span>In: 0</span>
        <span>Out: {article.silo_role === "PILLAR" ? 2 : 0}</span>
      </div>
    </div>
  );
}
