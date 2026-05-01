import Link from "next/link";
import { MiniWordPressHeader } from "@/components/admin/MiniWordPressHeader";
import { getEditorArticles } from "@/lib/actions/blog";
import { getSilos } from "@/lib/actions/silo";

export const metadata = { title: "Silos | Mini WordPress | FantasyIA" };

export default async function SilosPage() {
  const [silos, articles] = await Promise.all([getSilos(), getEditorArticles()]);
  const active = silos.filter((silo) => silo.is_active).length;
  const visible = silos.filter((silo) => silo.show_in_navigation).length;

  return (
    <>
      <MiniWordPressHeader
        title="Silos"
        description="Controle os hubs, grupos editoriais, links internos e saude do projeto."
      />
      <div className="space-y-4 p-4">
      <section className="rounded-lg border border-white/12 bg-[#303039] p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Arquitetura do site</p>
            <h2 className="mt-1 text-2xl font-bold uppercase text-white">Silos e hubs</h2>
            <p className="mt-2 text-sm text-slate-300">Padronize grupos, contraste a saude editorial e mantenha o hub navegavel.</p>
          </div>
          <Link href="/dashboard/blog/create" className="rounded-md bg-cyan-300 px-5 py-3 text-sm font-bold text-black">Novo post</Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Kpi label="Silos" value={String(silos.length)} helper="Estruturas cadastradas" />
          <Kpi label="Ativos" value={String(active)} helper="Hubs publicos ligados" />
          <Kpi label="No menu" value={String(visible)} helper="Rotas expostas na navegacao" />
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-white/12 bg-[#303039]">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-[#1d1c24] text-[10px] uppercase tracking-[0.12em] text-slate-400">
            <tr>
              <th className="px-3 py-3">Nome</th>
              <th className="px-3 py-3">Slug</th>
              <th className="px-3 py-3">Menu</th>
              <th className="px-3 py-3">Ativo</th>
              <th className="px-3 py-3">Nav publica</th>
              <th className="px-3 py-3">Posts</th>
              <th className="px-3 py-3">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {silos.map((silo) => (
              <tr key={silo.id} className="border-t border-white/10">
                <td className="px-3 py-4 font-bold text-white">{silo.name}</td>
                <td className="px-3 py-4 font-mono text-slate-300">/{silo.slug}</td>
                <td className="px-3 py-4 text-slate-300">{silo.menu_order || "-"}</td>
                <td className="px-3 py-4"><Tag ok={Boolean(silo.is_active)} label={silo.is_active ? "Ligado" : "Inativo"} /></td>
                <td className="px-3 py-4"><Tag ok={Boolean(silo.show_in_navigation)} label={silo.show_in_navigation ? "Visivel" : "Oculto"} amber /></td>
                <td className="px-3 py-4 text-slate-300">{articles.filter((article) => article.silo_id === silo.id).length}</td>
                <td className="px-3 py-4">
                  <Link href={`/dashboard/blog/silos/${silo.slug}`} className="rounded-md border border-white/15 bg-white/[0.05] px-3 py-2 text-xs font-bold text-white">
                    Abrir painel
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      </div>
    </>
  );
}

function Kpi({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-md border border-white/12 bg-white/[0.04] p-4">
      <p className="text-[10px] font-bold uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-slate-400">{helper}</p>
    </div>
  );
}

function Tag({ ok, label, amber }: { ok: boolean; label: string; amber?: boolean }) {
  return (
    <span className={`rounded-md border px-3 py-2 text-xs font-bold uppercase ${ok ? (amber ? "border-amber-300/35 bg-amber-300/10 text-amber-300" : "border-emerald-300/35 bg-emerald-300/10 text-emerald-300") : "border-white/15 bg-white/[0.05] text-slate-300"}`}>
      {label}
    </span>
  );
}
