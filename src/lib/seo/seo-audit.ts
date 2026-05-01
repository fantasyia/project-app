import type { BlogArticleRecord } from "@/lib/blog/types";
import { getArticleStats } from "@/lib/miniwordpress/article-analysis";

export type MiniWordPressSeoIssue = {
  severity: "high" | "medium" | "warning" | "info";
  message: string;
  action: string;
};

export function auditPostSeo(article: Pick<BlogArticleRecord, "title" | "content" | "meta_description" | "target_keyword" | "cover_image_url" | "silo_id">) {
  const stats = getArticleStats(article.content);
  const issues: MiniWordPressSeoIssue[] = [];

  if (!article.target_keyword) {
    issues.push({
      severity: "medium",
      message: "Post sem keyword principal.",
      action: "Definir target keyword no inspector SEO / KGR.",
    });
  }

  if (article.target_keyword && !article.title.toLowerCase().includes(article.target_keyword.toLowerCase())) {
    issues.push({
      severity: "warning",
      message: "Keyword nao aparece no titulo.",
      action: "Ajustar H1 ou escolher uma keyword mais natural.",
    });
  }

  if (!article.meta_description) {
    issues.push({
      severity: "high",
      message: "Meta description ausente.",
      action: "Escrever copy de SERP com 120 a 160 caracteres.",
    });
  }

  if (stats.headings.length < 2) {
    issues.push({
      severity: "warning",
      message: "Outline fraco.",
      action: "Adicionar H2/H3/H4 para escaneabilidade e TOC.",
    });
  }

  if (stats.words < 120) {
    issues.push({
      severity: "info",
      message: "Conteudo curto para SEO.",
      action: "Expandir contexto, exemplos e proximo passo.",
    });
  }

  if (!article.cover_image_url) {
    issues.push({
      severity: "info",
      message: "Cover ausente.",
      action: "Adicionar imagem principal com alt text.",
    });
  }

  if (!article.silo_id) {
    issues.push({
      severity: "warning",
      message: "Post fora da arquitetura de silo.",
      action: "Atribuir a um hub editorial.",
    });
  }

  return {
    issues,
    score: Math.max(0, Math.round(100 - issues.length * 14)),
    stats,
  };
}

export function auditCollectionSeo(articles: BlogArticleRecord[]) {
  const total = articles.length;
  const published = articles.filter((article) => article.status === "published").length;
  const drafts = articles.filter((article) => article.status === "draft").length;
  const review = articles.filter((article) => article.status === "review").length;
  const missingMeta = articles.filter((article) => !article.meta_description).length;
  const missingKeyword = articles.filter((article) => !article.target_keyword).length;
  const orphans = articles.filter((article) => !article.silo_id).length;

  const healthScore =
    total > 0
      ? Math.max(0, Math.round(100 - ((missingMeta + missingKeyword + orphans) / (total * 3)) * 100))
      : 0;

  return {
    total,
    published,
    drafts,
    review,
    missingMeta,
    missingKeyword,
    orphans,
    healthScore,
  };
}
