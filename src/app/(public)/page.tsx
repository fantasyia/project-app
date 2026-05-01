import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Newspaper } from "lucide-react";
import { getPublishedArticles } from "@/lib/actions/blog";

export default async function LandingPage() {
  const latestArticles = (await getPublishedArticles()).slice(0, 4);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="flex flex-col items-center px-6 pb-10 pt-14 text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/15">
          <span className="text-2xl font-bold text-brand-500">F</span>
        </div>
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-white">
          Seu universo premium.
          <br />
          <span className="text-brand-accent">Num só app.</span>
        </h1>
        <p className="mt-4 max-w-xs text-sm leading-relaxed text-brand-text-muted">
          Creators, assinaturas, chat direto e conteúdo exclusivo — tudo
          mobile-first, tudo num só lugar.
        </p>
        <div className="mt-6 flex w-full flex-col gap-2.5">
          <Link
            href="/register"
            className="flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-3.5 text-sm font-semibold text-black transition hover:bg-brand-400"
          >
            Começar agora
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/login"
            className="flex items-center justify-center rounded-xl border border-white/10 py-3.5 text-sm font-medium text-white transition hover:bg-white/[0.03]"
          >
            Já tenho uma conta
          </Link>
        </div>
      </section>

      <div className="h-px bg-white/[0.06]" />

      {/* Blog Section — SEO Visibility */}
      <section className="px-4 pb-8 pt-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Newspaper size={18} className="text-brand-text-muted" />
            <h2 className="text-base font-semibold text-white">Blog</h2>
          </div>
          <Link
            href="/blog"
            className="flex items-center gap-1 text-xs font-medium text-brand-400 transition hover:text-brand-300"
          >
            Ver todos
            <ArrowRight size={12} />
          </Link>
        </div>

        {latestArticles.length === 0 ? (
          <div className="py-10 text-center text-sm text-brand-text-muted">
            Nenhum artigo publicado ainda.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Featured Article */}
            {latestArticles[0] && (
              <Link
                href={`/blog/${latestArticles[0].slug}`}
                className="group relative aspect-[16/10] overflow-hidden rounded-xl bg-brand-surface-lowest"
              >
                {latestArticles[0].cover_image_url ? (
                  <Image
                    src={latestArticles[0].cover_image_url}
                    alt={latestArticles[0].title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-900 to-black text-4xl font-thin text-brand-300">
                    {latestArticles[0].title[0]}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <span className="mb-2 inline-block rounded bg-brand-500/20 px-2 py-0.5 text-[10px] font-semibold text-brand-300">
                    Destaque
                  </span>
                  <h3 className="text-lg font-semibold leading-snug text-white">
                    {latestArticles[0].title}
                  </h3>
                </div>
              </Link>
            )}

            {/* Other Articles */}
            {latestArticles.slice(1).map((article) => (
              <Link
                key={article.id}
                href={`/blog/${article.slug}`}
                className="flex items-center gap-3 border-b border-white/[0.04] pb-3 transition hover:opacity-80"
              >
                <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-brand-surface-low">
                  {article.cover_image_url ? (
                    <Image
                      src={article.cover_image_url}
                      alt={article.title}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-brand-300">
                      {article.title[0]}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{article.title}</p>
                  <p className="mt-0.5 text-[11px] text-brand-text-muted">
                    {article.published_at
                      ? new Date(article.published_at).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                        })
                      : "Sem data"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
