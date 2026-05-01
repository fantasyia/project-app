import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { MiniWordPressHeader } from "@/components/admin/MiniWordPressHeader";
import { getEditorArticles, publishArticle, unpublishArticle } from "@/lib/actions/blog";
import { getSilos } from "@/lib/actions/silo";
import { auditCollectionSeo } from "@/lib/seo/seo-audit";

export const metadata = { title: "Conteudo | Mini WordPress | FantasyIA" };

export default async function BlogCMSPage() {
  const [articles, silos] = await Promise.all([getEditorArticles(), getSilos().catch(() => [])]);
  const stats = auditCollectionSeo(articles);
  const siloById = new Map(silos.map((silo) => [silo.id, silo]));

  return (
    <>
      <MiniWordPressHeader
        title="Cockpit Editorial"
        description="Operacao compacta para posts, silos, SEO tecnico e publicacao."
      />
      <div className="space-y-4 p-4">
      <section className="rounded-lg border border-white/12 bg-[#303039] p-4 shadow-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Painel editorial</p>
            <h2 className="mt-1 text-2xl font-bold uppercase">
              <span className="bg-gradient-to-r from-cyan-200 via-sky-300 to-orange-300 bg-clip-text text-transparent">
                Conteudo em operacao
              </span>
            </h2>
          </div>
          <Link href="/dashboard/blog/create" className="rounded-md bg-cyan-300 px-5 py-3 text-sm font-bold text-black shadow-[0_0_18px_rgba(103,232,249,0.28)]">
            Criar novo post
          </Link>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge value={stats.total} label="total" />
          <Badge value={stats.drafts} label="rascunhos" />
          <Badge value={stats.review} label="revisao" />
          <Badge value={stats.published} label="publicados" />
          <Badge value={`${stats.healthScore}%`} label="saude SEO" />
        </div>
      </section>

      <section className="rounded-lg border border-white/12 bg-[#303039] p-3">
        <div className="grid gap-2 md:grid-cols-[150px_minmax(0,1fr)_72px]">
          <select className="rounded-md border border-white/15 bg-[#1d1c24] px-3 py-2 text-sm text-white">
            <option>Todos</option>
            <option>Rascunho</option>
            <option>Publicado</option>
          </select>
          <input className="rounded-md border border-white/15 bg-[#1d1c24] px-3 py-2 text-sm text-white outline-none placeholder:text-white/30" placeholder="Buscar por titulo ou slug" />
          <button className="rounded-md border border-white/15 bg-white/[0.05] px-3 py-2 text-sm font-bold text-white">Filtrar</button>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-white/12 bg-[#303039]">
        <div className="border-b border-white/12 px-4 py-4 text-sm text-slate-300">
          Selecione os itens que podem sair do backlog sem risco.
        </div>
        <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
          <thead className="bg-[#1d1c24] text-[10px] uppercase tracking-[0.12em] text-slate-400">
            <tr>
              <th className="px-3 py-3">Sel</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Capa</th>
              <th className="px-3 py-3">Titulo</th>
              <th className="px-3 py-3">Silo</th>
              <th className="px-3 py-3">Hierarquia</th>
              <th className="px-3 py-3">Atualizado</th>
              <th className="px-3 py-3">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((article) => {
              const silo = article.silo_id ? siloById.get(article.silo_id) : null;

              return (
                <tr key={article.id} className="border-t border-white/10 text-slate-200">
                  <td className="px-3 py-3"><input type="checkbox" /></td>
                  <td className="px-3 py-3"><Status status={article.status || "draft"} /></td>
                  <td className="px-3 py-3">
                    <div className="relative h-14 w-20 overflow-hidden rounded-md bg-[#1d1c24]">
                      {article.cover_image_url ? <Image src={article.cover_image_url} alt={article.title} fill sizes="80px" className="object-cover" /> : null}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-bold text-white">{article.title}</div>
                    <div className="mt-1 rounded border border-cyan-300/30 bg-cyan-300/10 px-2 py-1 font-mono text-xs text-cyan-200">/{article.slug}</div>
                  </td>
                  <td className="px-3 py-3 text-slate-300">{silo?.name || "Sem silo"}</td>
                  <td className="px-3 py-3">
                    <div className="font-bold text-white">{article.silo_role || "SUPPORT"}</div>
                    <div className="text-xs text-slate-400">{article.silo_group || "-"}</div>
                  </td>
                  <td className="px-3 py-3 text-slate-300">
                    {article.created_at ? new Date(article.created_at).toLocaleDateString("pt-BR") : "-"}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/dashboard/blog/editor/${article.id}`} className="rounded-md border border-white/15 bg-white/[0.05] px-3 py-2 text-xs font-bold text-white">
                        Editar
                      </Link>
                      <Link href={`/blog/${article.slug}`} target="_blank" className="rounded-md border border-amber-300/40 bg-amber-300/10 px-3 py-2 text-xs font-bold text-amber-200">
                        <ExternalLink size={13} className="inline" /> URL publica
                      </Link>
                      {article.status === "published" ? (
                        <form action={async () => { "use server"; await unpublishArticle(article.id); }}>
                          <button className="rounded-md bg-cyan-300 px-3 py-2 text-xs font-bold text-black">Despublicar</button>
                        </form>
                      ) : (
                        <form action={async () => { "use server"; await publishArticle(article.id); }}>
                          <button className="rounded-md bg-cyan-300 px-3 py-2 text-xs font-bold text-black">Publicar</button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
      </div>
    </>
  );
}

function Badge({ value, label }: { value: string | number; label: string }) {
  return (
    <span className="rounded-md border border-white/15 bg-white/[0.05] px-3 py-2 text-xs font-bold uppercase text-slate-200">
      {value} <span className="ml-1 text-slate-400">{label}</span>
    </span>
  );
}

function Status({ status }: { status: string }) {
  const published = status === "published";
  return (
    <span className={`rounded-md border px-3 py-2 text-xs font-bold uppercase ${published ? "border-emerald-300/35 bg-emerald-300/10 text-emerald-300" : "border-white/15 bg-white/[0.05] text-slate-300"}`}>
      {published ? "Publicado" : "Rascunho"}
    </span>
  );
}
