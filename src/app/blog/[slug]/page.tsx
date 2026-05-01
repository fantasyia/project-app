import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Clock, Share2 } from "lucide-react";
import { ArticleRichContent } from "@/components/blog/article-rich-content";
import { getArticleBySlug } from "@/lib/actions/blog";
import { contentToPlainText } from "@/lib/blog/content";
import { getArticleStats } from "@/lib/miniwordpress/article-analysis";
import { fantasyiaBlogBrand } from "@/lib/miniwordpress/fantasyia-brand";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return { title: "Artigo nao encontrado | FantasyIA" };
  }

  return {
    title: article.meta_title || `${article.title} | FantasyIA Blog`,
    description: article.meta_description || article.excerpt || contentToPlainText(article.content).slice(0, 160),
    alternates: article.canonical_path ? { canonical: article.canonical_path } : undefined,
    openGraph: {
      title: article.title,
      description: article.meta_description || article.excerpt || contentToPlainText(article.content).slice(0, 160),
      images: article.cover_image_url ? [article.cover_image_url] : [],
      type: "article",
      publishedTime: article.published_at || undefined,
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) return notFound();

  const stats = getArticleStats(article.content);

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-black/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link
            href="/blog"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-brand-text-muted transition hover:text-white"
            aria-label="Voltar"
          >
            <ArrowLeft size={18} />
          </Link>
          <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-text-muted">
            FantasyIA Editorial
          </span>
          <button className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-brand-text-muted transition hover:text-white">
            <Share2 size={17} />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 pb-14">
        <article>
          <section className="py-6 md:py-10">
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-400">
              <Link href="/blog" className="hover:text-brand-300">Blog</Link>
              <span className="text-brand-text-muted">/</span>
              <span>{article.silo_group || article.category || fantasyiaBlogBrand.tagline}</span>
            </div>
            <h1 className="mt-4 max-w-4xl text-4xl font-light leading-tight tracking-tight text-white md:text-6xl">
              {article.title}
            </h1>
            {article.excerpt ? (
              <p className="mt-5 max-w-3xl text-base leading-8 text-brand-text-base md:text-lg">{article.excerpt}</p>
            ) : null}
            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-brand-text-muted">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
                <Calendar size={13} />
                {article.published_at
                  ? new Date(article.published_at).toLocaleDateString("pt-BR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "Rascunho"}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
                <Clock size={13} />
                {stats.readingTime} min de leitura
              </span>
              {article.author ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
                  {article.author.display_name || "Equipe FantasyIA"}
                </span>
              ) : null}
            </div>
          </section>

          {article.cover_image_url ? (
            <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-white/8 bg-brand-surface-lowest">
              <Image
                src={article.cover_image_url}
                alt={article.title}
                fill
                sizes="(min-width: 1024px) 960px, 100vw"
                className="object-cover"
              />
            </div>
          ) : null}

          <section className="mt-8 grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
            <aside className="lg:sticky lg:top-20 lg:h-fit">
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-400">Indice</p>
                {stats.headings.length > 0 ? (
                  <nav className="mt-3 space-y-2">
                    {stats.headings.map((heading) => (
                      <a
                        key={heading.id}
                        href={`#${heading.id}`}
                        className={`block text-xs leading-5 text-brand-text-muted transition hover:text-white ${
                          heading.level >= 3 ? "pl-3" : ""
                        }`}
                      >
                        {heading.text}
                      </a>
                    ))}
                  </nav>
                ) : (
                  <p className="mt-3 text-xs leading-5 text-brand-text-muted">O artigo ainda nao possui H2/H3 para indice.</p>
                )}
              </div>
            </aside>

            <div className="min-w-0">
              <ArticleRichContent content={article.content} />

              <div className="mt-10 rounded-2xl border border-brand-500/20 bg-brand-500/8 p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-400">
                  Proximo passo
                </p>
                <h2 className="mt-2 text-2xl font-light text-white">Explore o FantasyIA por dentro</h2>
                <p className="mt-2 text-sm leading-6 text-brand-text-base">
                  Veja planos, descubra creators e conecte o conteudo editorial com a experiencia privada premium.
                </p>
                <Link
                  href="/pricing"
                  className="mt-4 inline-flex rounded-full bg-brand-500 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-black hover:bg-brand-400"
                >
                  Ver planos
                </Link>
              </div>
            </div>
          </section>
        </article>
      </main>
    </div>
  );
}
