import Link from "next/link";

export const metadata = { title: "Promovidos | Afiliado Fantasyia" };

export default function PromotedPage() {
  return (
    <div className="w-full space-y-6 px-4 py-5 pb-24">
      <section className="rounded-[32px] border border-white/8 bg-white/[0.035] p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-brand-300">Portifolio</p>
        <h1 className="mt-3 text-4xl font-thin tracking-[-0.05em] text-white">
          Creators <span className="text-brand-500">promovidos</span>
        </h1>
        <p className="mt-3 text-sm leading-6 text-brand-text-muted">
          Lista de creators vinculados aos seus links rastreaveis.
        </p>
      </section>

      <section className="rounded-[28px] border border-dashed border-white/10 bg-black/25 px-5 py-12 text-center">
        <p className="text-sm text-brand-text-muted">Sua carteira de creators promovidos aparece aqui.</p>
        <p className="mt-2 text-xs text-brand-text-muted">Comece gerando links e segmentando campanhas.</p>
        <Link href="/dashboard/affiliate/links" className="mt-5 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-brand-300">
          Gerar links
        </Link>
      </section>
    </div>
  );
}
