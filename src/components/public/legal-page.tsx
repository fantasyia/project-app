type LegalSection = {
  heading: string;
  body: string;
};

export function LegalPage({
  title,
  updatedAt,
  sections,
}: {
  title: string;
  updatedAt: string;
  sections: LegalSection[];
}) {
  return (
    <div className="px-4 pb-8 pt-5">
      <section className="rounded-[28px] border border-white/8 bg-white/[0.03] p-5">
        <p className="text-[10px] uppercase tracking-[0.24em] text-brand-text-muted">Documento legal</p>
        <h1 className="mt-3 text-3xl font-thin tracking-[-0.03em] text-white">{title}</h1>
        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-brand-text-muted">
          Ultima atualizacao: {updatedAt}
        </p>
      </section>

      <section className="mt-4 space-y-3">
        {sections.map((section) => (
          <article
            key={section.heading}
            className="rounded-2xl border border-white/8 bg-black/25 p-4"
          >
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-300">
              {section.heading}
            </h2>
            <p className="mt-2 text-sm leading-6 text-brand-text-base">{section.body}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
