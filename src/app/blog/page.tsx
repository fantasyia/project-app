import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Search, Sparkles } from "lucide-react";
import { getPublishedArticles } from "@/lib/actions/blog";
import { getSilos } from "@/lib/actions/silo";
import { fantasyiaBlogBrand } from "@/lib/miniwordpress/fantasyia-brand";

export const metadata = {
  title: "Blog | FantasyIA",
  description: fantasyiaBlogBrand.description,
};

export default async function PublicBlogPage() {
  const [articles, silos] = await Promise.all([getPublishedArticles(), getSilos()]);
  const activeSilos =
    silos.filter((silo) => silo.is_active && silo.show_in_navigation).length > 0
      ? silos.filter((silo) => silo.is_active && silo.show_in_navigation)
      : fantasyiaBlogBrand.fallbackSilos.map((silo, index) => ({
          id: silo.slug,
          name: silo.name,
          slug: silo.slug,
          menu_order: index,
        }));
  const [featuredArticle, ...otherArticles] = articles;
  const topArticles = otherArticles.slice(0, 6);

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-black/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3">
          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-brand-text-muted transition hover:text-white"
            aria-label="Voltar"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-brand-400">
              Mini WordPress
            </p>
            <h1 className="truncate text-base font-semibold text-white">FantasyIA Editorial</h1>
          </div>
          <Link
            href="/pricing"
            className="rounded-full bg-brand-500 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-black transition hover:bg-brand-400"
          >
            Planos
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-12">
        <section className="grid gap-6 py-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:py-10">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-400">
              <Sparkles size={14} />
              {fantasyiaBlogBrand.tagline}
            </div>
            <h2 className="mt-4 max-w-3xl text-4xl font-light tracking-tight text-white md:text-6xl">
              Arte IA, creators e conteudo visual privado premium.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-brand-text-base">
              Estrategias, tendencias e guias para quem produz, organiza ou consome experiencias visuais premium.
            </p>
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-brand-text-muted">
              <Search size={16} />
              <span className="text-sm">{fantasyiaBlogBrand.searchPlaceholder}</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link
                href="/blog"
                className="row-span-2 flex items-center justify-center rounded-xl bg-brand-500 px-3 py-4 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-black"
              >
                Inicio
              </Link>
              {activeSilos.slice(0, 6).map((silo) => (
                <Link
                  key={silo.slug}
                  href={`/blog/s/${silo.slug}`}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-brand-text-base transition hover:border-brand-500/35 hover:text-white"
                >
                  {silo.name}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {featuredArticle ? (
          <section className="grid overflow-hidden rounded-2xl border border-white/8 bg-[#080808] lg:grid-cols-[0.95fr_1.05fr]">
            <Link href={`/blog/${featuredArticle.slug}`} className="group relative block min-h-[360px] overflow-hidden">
              {featuredArticle.cover_image_url ? (
                <Image
                  src={featuredArticle.cover_image_url}
                  alt={featuredArticle.title}
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full min-h-[360px] items-center justify-center bg-[radial-gradient(circle_at_top,rgba(0,168,107,0.24),#050505_70%)] text-7xl font-thin text-brand-300">
                  {featuredArticle.title[0]}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            </Link>
            <div className="flex flex-col justify-center p-6 md:p-8">
              <span className="w-fit rounded-full border border-brand-500/25 bg-brand-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-300">
                Destaque editorial
              </span>
              <Link href={`/blog/${featuredArticle.slug}`} className="mt-5 text-3xl font-light leading-tight text-white transition hover:text-brand-300 md:text-5xl">
                {featuredArticle.title}
              </Link>
              {featuredArticle.excerpt ? (
                <p className="mt-4 text-sm leading-7 text-brand-text-base">{featuredArticle.excerpt}</p>
              ) : null}
              <div className="mt-6 flex items-center justify-between border-t border-white/8 pt-4 text-xs text-brand-text-muted">
                <span>{featuredArticle.published_at ? new Date(featuredArticle.published_at).toLocaleDateString("pt-BR") : "Rascunho"}</span>
                <Link href={`/blog/${featuredArticle.slug}`} className="text-brand-400 hover:text-brand-300">
                  Ler artigo
                </Link>
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-2xl border border-white/8 bg-white/[0.03] px-6 py-16 text-center text-sm text-brand-text-muted">
            Nenhum artigo publicado ainda.
          </section>
        )}

        {topArticles.length > 0 ? (
          <section className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {topArticles.map((article) => (
              <Link
                key={article.id}
                href={`/blog/${article.slug}`}
                className="group rounded-2xl border border-white/8 bg-white/[0.03] p-3 transition hover:border-brand-500/25 hover:bg-white/[0.05]"
              >
                <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-brand-surface-lowest">
                  {article.cover_image_url ? (
                    <Image src={article.cover_image_url} alt={article.title} fill sizes="33vw" className="object-cover transition duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-3xl font-thin text-brand-300">
                      {article.title[0]}
                    </div>
                  )}
                </div>
                <div className="px-1 py-3">
                  <h3 className="line-clamp-2 text-base font-medium leading-snug text-white">{article.title}</h3>
                  {article.excerpt ? <p className="mt-2 line-clamp-2 text-xs leading-5 text-brand-text-muted">{article.excerpt}</p> : null}
                </div>
              </Link>
            ))}
          </section>
        ) : null}
      </main>
    </div>
  );
}
