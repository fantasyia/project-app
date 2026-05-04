import { notFound } from "next/navigation";
import { AdvancedEditor } from "@/components/editor/AdvancedEditor";
import { getArticleByIdForEditor } from "@/lib/actions/blog";
import { getSilos } from "@/lib/actions/silo";
import type { PostWithSilo, Silo } from "@/lib/types";

export const metadata = { title: "Editor de posts | Mini WordPress | FantasyIA" };

function normalizeSilos(rawSilos: any[]): Silo[] {
  return rawSilos.map((silo) => ({
    id: silo.id,
    name: silo.name,
    slug: silo.slug,
    description: silo.description ?? null,
    meta_title: silo.meta_title ?? null,
    meta_description: silo.meta_description ?? null,
    hero_image_url: silo.hero_image_url ?? null,
    hero_image_alt: silo.hero_image_alt ?? null,
    pillar_content_json: silo.pillar_content_json ?? null,
    pillar_content_html: silo.pillar_content_html ?? null,
    menu_order: silo.menu_order ?? 0,
    is_active: silo.is_active ?? true,
    show_in_navigation: silo.show_in_navigation ?? true,
    created_at: silo.created_at ?? new Date(0).toISOString(),
  }));
}

function normalizePost(article: any, silos: Silo[]): PostWithSilo {
  const silo = article.silo_id ? silos.find((item) => item.id === article.silo_id) : null;
  return {
    id: article.id,
    silo_id: article.silo_id ?? null,
    title: article.title ?? "",
    seo_title: article.seo_title ?? article.meta_title ?? article.title ?? "",
    meta_title: article.meta_title ?? article.seo_title ?? article.title ?? "",
    slug: article.slug ?? "",
    target_keyword: article.target_keyword ?? article.focus_keyword ?? "",
    focus_keyword: article.focus_keyword ?? article.target_keyword ?? "",
    content_json: article.content_json ?? null,
    content_html: article.content_html ?? article.content ?? "",
    seo_score: article.seo_score ?? null,
    supporting_keywords: Array.isArray(article.supporting_keywords) ? article.supporting_keywords : [],
    meta_description: article.meta_description ?? article.excerpt ?? null,
    excerpt: article.excerpt ?? null,
    canonical_path: article.canonical_path ?? null,
    entities: Array.isArray(article.entities) ? article.entities : [],
    faq_json: article.faq_json ?? [],
    howto_json: article.howto_json ?? [],
    schema_type: article.schema_type ?? "article",
    cover_image: article.cover_image ?? article.cover_image_url ?? null,
    hero_image_url: article.hero_image_url ?? article.cover_image_url ?? null,
    hero_image_alt: article.hero_image_alt ?? article.title ?? "",
    og_image_url: article.og_image_url ?? article.cover_image_url ?? null,
    images: Array.isArray(article.images) ? article.images : [],
    intent: article.intent ?? "informational",
    pillar_rank: article.pillar_rank ?? null,
    silo_role: article.silo_role ?? "SUPPORT",
    silo_group: article.silo_group ?? null,
    silo_order: article.silo_order ?? 0,
    silo_group_order: article.silo_group_order ?? 0,
    show_in_silo_menu: typeof article.show_in_silo_menu === "boolean" ? article.show_in_silo_menu : true,
    is_featured: article.is_featured ?? null,
    author_name: article.author_name ?? "Equipe FantasyIA",
    expert_name: article.expert_name ?? "Equipe FantasyIA",
    expert_role: article.expert_role ?? "Equipe editorial",
    expert_bio: article.expert_bio ?? null,
    expert_credentials: article.expert_credentials ?? null,
    reviewed_by: article.reviewed_by ?? null,
    reviewed_at: article.reviewed_at ?? null,
    sources: Array.isArray(article.sources) ? article.sources : [],
    disclaimer: article.disclaimer ?? null,
    scheduled_at: article.scheduled_at ?? null,
    published_at: article.published_at ?? null,
    status: article.status ?? "draft",
    imported_source: article.imported_source ?? null,
    imported_at: article.imported_at ?? null,
    raw_payload: article.raw_payload ?? null,
    amazon_products: article.amazon_products ?? [],
    published: article.published ?? article.status === "published",
    updated_at: article.updated_at ?? article.created_at ?? new Date(0).toISOString(),
    silo: silo ? { slug: silo.slug, name: silo.name } : null,
  };
}

export default async function MiniWordPressEditorPage({ params }: { params: Promise<{ articleId: string }> }) {
  const { articleId } = await params;
  const [article, rawSilos] = await Promise.all([
    getArticleByIdForEditor(articleId),
    getSilos().catch(() => []),
  ]);

  if (!article) return notFound();

  const silos = normalizeSilos(rawSilos as any[]);
  const post = normalizePost(article, silos);

  return <AdvancedEditor post={post} silos={silos} />;
}
