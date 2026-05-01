import Link from "next/link";
import { AlertTriangle, BarChart3, CheckCircle, XCircle } from "lucide-react";
import { MiniWordPressHeader } from "@/components/admin/MiniWordPressHeader";
import { getMyArticles } from "@/lib/actions/blog";
import { getSilos } from "@/lib/actions/silo";

export const metadata = { title: "Auditoria SEO | Blog CMS | Fantasyia" };

type Issue = {
  severity: "high" | "warning" | "medium" | "info";
  message: string;
  action: string;
};

export default async function SeoAuditPage() {
  const [silos, articles] = await Promise.all([getSilos(), getMyArticles()]);

  const totalArticles = articles.length;
  const published = articles.filter((article) => article.status === "published");
  const drafts = articles.filter((article) => article.status === "draft");
  const withSilo = articles.filter((article) => Boolean(article.silo_id));
  const orphans = articles.filter((article) => !article.silo_id);
  const missingMeta = articles.filter((article) => !article.meta_description);
  const missingKeyword = articles.filter((article) => !article.target_keyword);

  const healthScore =
    totalArticles > 0
      ? Math.round(((withSilo.length + published.length - missingMeta.length) / (totalArticles * 2)) * 100)
      : 0;

  const issues: Issue[] = [];

  if (orphans.length > 0) {
    issues.push({
      severity: "warning",
      message: `${orphans.length} artigo(s) sem silo atribuido`,
      action: "Atribuir a um silo editorial",
    });
  }

  if (missingMeta.length > 0) {
    issues.push({
      severity: "high",
      message: `${missingMeta.length} artigo(s) sem meta description`,
      action: "Adicionar meta description",
    });
  }

  if (missingKeyword.length > 0) {
    issues.push({
      severity: "medium",
      message: `${missingKeyword.length} artigo(s) sem keyword principal`,
      action: "Definir target keyword",
    });
  }

  if (drafts.length > published.length) {
    issues.push({
      severity: "info",
      message: `Mais rascunhos (${drafts.length}) que publicados (${published.length})`,
      action: "Revisar pauta e publicar os melhores",
    });
  }

  const siloCoverage = silos.map((silo) => {
    const siloArticles = articles.filter((article) => article.silo_id === silo.id);
    const hasPillar = siloArticles.some((article) => article.silo_role === "PILLAR");

    return {
      ...silo,
      count: siloArticles.length,
      hasPillar,
    };
  });

  return (
    <>
      <MiniWordPressHeader
        title="SEO"
        description="Diagnostico da saude editorial do blog, cobrindo silo, metadata e prontidao de publicacao."
      />
      <div className="mx-auto max-w-6xl space-y-10 px-6 py-6 md:px-8 md:py-10">

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <MetricCard label="Health score" value={healthScore.toString()} accent={healthScore >= 70 ? "brand" : healthScore >= 40 ? "warning" : "danger"} />
        <MetricCard label="Total artigos" value={totalArticles.toString()} accent="neutral" />
        <MetricCard label="Publicados" value={published.length.toString()} accent="brand" />
        <MetricCard label="Sem silo" value={orphans.length.toString()} accent={orphans.length > 0 ? "warning" : "neutral"} />
      </div>

      {issues.length > 0 ? (
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 border-b border-white/5 pb-4 text-xs font-semibold uppercase tracking-[0.3em] text-white">
            <AlertTriangle size={14} className="text-yellow-400" /> Issues detectadas
          </h2>
          <div className="space-y-3">
            {issues.map((issue) => (
              <div
                key={issue.message}
                className={`flex items-start gap-4 rounded-[24px] border p-4 ${
                  issue.severity === "high"
                    ? "border-red-500/20 bg-red-500/5"
                    : issue.severity === "warning"
                      ? "border-yellow-500/20 bg-yellow-500/5"
                      : issue.severity === "medium"
                        ? "border-orange-500/20 bg-orange-500/5"
                        : "border-white/10 bg-white/[0.03]"
                }`}
              >
                {issue.severity === "high" ? (
                  <XCircle size={16} className="mt-0.5 text-red-400" />
                ) : issue.severity === "warning" ? (
                  <AlertTriangle size={16} className="mt-0.5 text-yellow-400" />
                ) : (
                  <BarChart3 size={16} className="mt-0.5 text-brand-text-muted" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-light text-white">{issue.message}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-brand-text-muted">{issue.action}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : totalArticles > 0 ? (
        <div className="flex items-center gap-4 rounded-[24px] border border-brand-500/20 bg-brand-500/5 p-6">
          <CheckCircle size={20} className="text-brand-500" />
          <span className="text-sm font-light text-white">Nenhuma issue critica detectada. O blog esta saudavel.</span>
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="rounded-[28px] border border-white/6 bg-brand-surface-lowest/80 p-5 md:p-6">
            <h2 className="border-b border-white/5 pb-4 text-xs font-semibold uppercase tracking-[0.3em] text-white">
              Cobertura por silo
            </h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {siloCoverage.map((silo) => (
                <div
                  key={silo.id}
                  className="flex items-center justify-between rounded-[22px] border border-white/8 bg-white/[0.03] p-4"
                >
                  <div>
                    <h3 className="text-sm font-light text-white">{silo.name}</h3>
                    <p className="mt-1 text-[10px] uppercase tracking-widest text-brand-text-muted">
                      {silo.count} artigo{silo.count === 1 ? "" : "s"} · {silo.hasPillar ? "Pilar definido" : "Sem pilar"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-widest ${
                      silo.count >= 3
                        ? "bg-brand-500/10 text-brand-400"
                        : silo.count >= 1
                          ? "bg-yellow-500/10 text-yellow-300"
                          : "bg-red-500/10 text-red-300"
                    }`}
                  >
                    {silo.count >= 3 ? "OK" : silo.count >= 1 ? "Expandir" : "Vazio"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <ActionPanel
            title="Sem meta description"
            items={missingMeta.map((article) => ({
              id: article.id,
              title: article.title,
              helper: article.status === "published" ? "Publicado sem copy de SERP" : "Rascunho sem meta pronta",
            }))}
            empty="Nenhum artigo com meta faltando."
          />
          <ActionPanel
            title="Sem silo definido"
            items={orphans.map((article) => ({
              id: article.id,
              title: article.title,
              helper: article.status === "published" ? "Publicado fora da malha editorial" : "Rascunho ainda solto",
            }))}
            empty="Nenhum artigo orfao."
          />
        </div>
      </section>
      </div>
    </>
  );
}

function MetricCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "brand" | "warning" | "danger" | "neutral";
}) {
  const accentClass =
    accent === "brand"
      ? "text-brand-500"
      : accent === "warning"
        ? "text-yellow-400"
        : accent === "danger"
          ? "text-red-400"
          : "text-white";

  return (
    <div className="rounded-[24px] border border-white/6 bg-brand-surface-low p-6 text-center">
      <div className={`text-4xl font-thin tracking-tighter ${accentClass}`}>{value}</div>
      <p className="mt-2 text-[10px] uppercase tracking-widest text-brand-text-muted">{label}</p>
    </div>
  );
}

function ActionPanel({
  title,
  items,
  empty,
}: {
  title: string;
  items: Array<{ id: string; title: string; helper: string }>;
  empty: string;
}) {
  return (
    <div className="rounded-[28px] border border-white/6 bg-brand-surface-lowest/80 p-5 md:p-6">
      <h2 className="border-b border-white/5 pb-4 text-xs font-semibold uppercase tracking-[0.3em] text-white">
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="mt-5 text-sm font-light text-brand-text-muted">{empty}</p>
      ) : (
        <div className="mt-5 space-y-3">
          {items.slice(0, 5).map((item) => (
            <Link
              key={item.id}
              href={`/dashboard/blog/${item.id}/edit`}
              className="block rounded-[22px] border border-white/8 bg-white/[0.03] p-4 transition-colors hover:border-brand-500/20"
            >
              <p className="text-sm text-white">{item.title}</p>
              <p className="mt-1 text-[10px] uppercase tracking-widest text-brand-text-muted">{item.helper}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
