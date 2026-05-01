import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Layers, Route } from "lucide-react";
import { getArticlesBySiloSlug } from "@/lib/actions/silo";

export async function generateMetadata({ params }: { params: Promise<{ silo: string }> }) {
  const { silo: siloSlug } = await params;
  const { silo } = await getArticlesBySiloSlug(siloSlug);

  if (!silo) {
    return { title: "Silo nao encontrado | FantasyIA" };
  }

  return {
    title: silo.meta_title || `${silo.name} | FantasyIA Blog`,
    description: silo.meta_description || silo.description,
  };
}

export default async function SiloHubPage({ params }: { params: Promise<{ silo: string }> }) {
  const { silo: siloSlug } = await params;
  const { silo, articles } = await getArticlesBySiloSlug(siloSlug);

  if (!silo) return notFound();

  const pillar = articles.find((article) => article.silo_role === "PILLAR");
  const support = articles.filter((article) => article.silo_role === "SUPPORT" || !article.silo_role);
  const aux = articles.filter((article) => article.silo_role === "AUX");
  const groups = Array.from(new Set(articles.map((article) => article.silo_group).filter(Boolean)));

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-black/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3">
          <Link
            href="/blog"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-brand-text-muted transition hover:text-white"
            aria-label="Voltar"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-400">Silo editorial</p>
            <h1 className="truncate text-base font-semibold text-white">{silo.name}</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-12">
        <section className="grid gap-6 py-6 md:py-10 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-400">
              <Layers size={14} />
              /{silo.slug}
            </div>
            <h2 className="mt-4 max-w-4xl text-4xl font-light tracking-tight text-white md:text-6xl">{silo.name}</h2>
            {silo.description ? (
              <p className="mt-4 max-w-2xl text-sm leading-7 text-brand-text-base">{silo.description}</p>
            ) : null}
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-400">
              <Route size={14} />
              Saude do hub
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <Kpi label="Posts" value={articles.length.toString()} />
              <Kpi label="Pilar" value={pillar ? "1" : "0"} />
              <Kpi label="Grupos" value={groups.length.toString()} />
            </div>
          </div>
        </section>

        {pillar ? (
          <Link
            href={`/blog/${pillar.slug}`}
            className="block rounded-2xl border border-brand-500/20 bg-brand-500/8 p-6 transition hover:border-brand-500/40"
          >
            <span className="rounded-full bg-brand-500 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-black">
              Artigo pilar
            </span>
            <h2 className="mt-4 max-w-3xl text-3xl font-light leading-tight text-white">{pillar.title}</h2>
            {pillar.excerpt ? <p className="mt-3 max-w-2xl text-sm leading-7 text-brand-text-base">{pillar.excerpt}</p> : null}
          </Link>
        ) : null}

        <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-3">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.26em] text-white">Posts de suporte</h2>
            {support.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {support.map((article) => (
                  <Link
                    key={article.id}
                    href={`/blog/${article.slug}`}
                    className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 transition hover:border-brand-500/25 hover:bg-white/[0.05]"
                  >
                    {article.silo_group ? (
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-400">{article.silo_group}</p>
                    ) : null}
                    <h3 className="mt-2 text-lg font-light leading-snug text-white">{article.title}</h3>
                    {article.excerpt ? <p className="mt-2 line-clamp-3 text-xs leading-5 text-brand-text-muted">{article.excerpt}</p> : null}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-6 py-12 text-center text-sm text-brand-text-muted">
                Nenhum artigo de suporte publicado neste silo ainda.
              </div>
            )}
          </div>

          <aside className="space-y-4">
            {groups.length > 0 ? (
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-400">Grupos editoriais</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {groups.map((group) => (
                    <span key={group} className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-brand-text-base">
                      {group}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {aux.length > 0 ? (
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-400">Complementares</p>
                <div className="mt-3 space-y-2">
                  {aux.map((article) => (
                    <Link
                      key={article.id}
                      href={`/blog/${article.slug}`}
                      className="block rounded-xl border border-white/8 bg-black/30 px-3 py-2 text-sm text-white hover:border-brand-500/30"
                    >
                      {article.title}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </aside>
        </section>
      </main>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-black/30 px-3 py-3">
      <p className="text-xl font-light text-white">{value}</p>
      <p className="mt-1 text-[9px] uppercase tracking-[0.18em] text-brand-text-muted">{label}</p>
    </div>
  );
}
