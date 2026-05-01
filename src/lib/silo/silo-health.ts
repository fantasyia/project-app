import type { BlogArticleRecord, BlogSiloRecord } from "@/lib/blog/types";

export function getSiloHealth(silo: BlogSiloRecord, articles: BlogArticleRecord[]) {
  const siloArticles = articles.filter((article) => article.silo_id === silo.id);
  const pillar = siloArticles.find((article) => article.silo_role === "PILLAR");
  const support = siloArticles.filter((article) => article.silo_role === "SUPPORT" || !article.silo_role);
  const aux = siloArticles.filter((article) => article.silo_role === "AUX");
  const groups = Array.from(new Set(siloArticles.map((article) => article.silo_group).filter(Boolean)));
  const missingMeta = siloArticles.filter((article) => !article.meta_description).length;
  const healthScore = Math.max(
    0,
    Math.min(100, 40 + (pillar ? 25 : 0) + Math.min(25, support.length * 5) + Math.min(10, groups.length * 2) - missingMeta * 8)
  );

  return {
    silo,
    articles: siloArticles,
    pillar,
    support,
    aux,
    groups,
    healthScore,
    status: healthScore >= 75 ? "OK" : healthScore >= 50 ? "PENDENCIAS" : "RISCO",
  };
}
