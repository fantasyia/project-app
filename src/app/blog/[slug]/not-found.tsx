import Link from "next/link";

export default function BlogArticleNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-center text-white">
      <p className="text-xs text-brand-text-muted">Blog</p>
      <h1 className="mt-2 text-2xl font-bold text-white">Artigo não encontrado</h1>
      <p className="mt-3 text-sm leading-relaxed text-brand-text-muted">
        Esse link pode estar errado, o artigo pode estar em rascunho ou ainda não foi publicado.
      </p>
      <div className="mt-6 flex flex-col gap-2.5 w-full max-w-xs">
        <Link
          href="/blog"
          className="flex items-center justify-center rounded-xl bg-brand-500 py-3 text-sm font-semibold text-black transition hover:bg-brand-400"
        >
          Voltar ao blog
        </Link>
        <Link
          href="/dashboard/blog"
          className="flex items-center justify-center rounded-xl border border-white/10 py-3 text-sm font-medium text-white transition hover:bg-white/[0.03]"
        >
          Abrir CMS
        </Link>
      </div>
    </div>
  );
}
