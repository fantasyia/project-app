"use server";

/**
 * Blog Multi-Silo Actions
 * Gerencia silos, grupos editoriais e hierarquia de artigos.
 */

import type { BlogArticleRecord, BlogAuthorSummary, BlogSiloRecord } from "@/lib/blog/types";
import { requireEditorialRole } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type SiloArticleRow = Omit<BlogArticleRecord, "author"> & {
  author?: BlogAuthorSummary | BlogAuthorSummary[] | null;
};

function takeFirstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

// =============================================
// SILO CRUD
// =============================================

export async function getSilos() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("silos")
    .select("*, silo_groups(*)")
    .order("menu_order", { ascending: true });
  return (data || []) as BlogSiloRecord[];
}

export async function getSiloBySlug(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("silos")
    .select("*, silo_groups(*)")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  return (data || null) as BlogSiloRecord | null;
}

export async function createSilo(formData: FormData) {
  const { supabase } = await requireEditorialRole();
  const name = formData.get("name") as string;
  const slug = (formData.get("slug") as string) || name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const description = formData.get("description") as string;
  const metaTitle = formData.get("meta_title") as string;
  const metaDescription = formData.get("meta_description") as string;

  const { data: silo, error } = await supabase.from("silos").insert({
    name,
    slug,
    description,
    meta_title: metaTitle || `${name} | Fantasyia Blog`,
    meta_description: metaDescription || description,
  }).select().single();

  if (error) return { error: error.message };

  revalidatePath("/dashboard/blog");
  return { success: true, silo };
}

export async function updateSilo(siloId: string, formData: FormData) {
  const { supabase } = await requireEditorialRole();

  const { error } = await supabase.from("silos").update({
    name: formData.get("name") as string,
    description: formData.get("description") as string,
    meta_title: formData.get("meta_title") as string,
    meta_description: formData.get("meta_description") as string,
    is_active: formData.get("is_active") === "true",
  }).eq("id", siloId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/blog");
  return { success: true };
}

// =============================================
// SILO ARTICLES (hierarchical queries)
// =============================================

export async function getSiloArticles(siloId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_articles")
    .select("id, title, slug, status, silo_role, silo_group, silo_order, category, tags, published_at, created_at")
    .eq("silo_id", siloId)
    .order("silo_order", { ascending: true });
  return (data || []) as BlogArticleRecord[];
}

export async function getArticlesBySiloSlug(siloSlug: string) {
  const supabase = await createClient();
  
  // First get silo
  const { data: silo } = await supabase
    .from("silos")
    .select("id, name, slug, description, meta_title, meta_description")
    .eq("slug", siloSlug)
    .eq("is_active", true)
    .maybeSingle();
  
  if (!silo) return { silo: null, articles: [] as BlogArticleRecord[] };

  const { data: articles } = await supabase
    .from("blog_articles")
    .select("id, title, slug, excerpt, cover_image_url, silo_role, silo_group, published_at, author:users!blog_articles_author_id_users_id_fk(display_name, handle)")
    .eq("silo_id", silo.id)
    .eq("status", "published")
    .order("silo_order", { ascending: true });

  const normalizedArticles = ((articles || []) as SiloArticleRow[]).map((article) => ({
    ...article,
    author: takeFirstRelation(article.author),
  }));

  return {
    silo: silo as BlogSiloRecord,
    articles: normalizedArticles,
  };
}

// =============================================
// ASSIGN ARTICLE TO SILO
// =============================================

export async function assignArticleToSilo(articleId: string, formData: FormData) {
  const { supabase } = await requireEditorialRole();
  const siloId = formData.get("silo_id") as string;
  const siloRole = formData.get("silo_role") as string;
  const siloGroup = formData.get("silo_group") as string;
  const category = formData.get("category") as string;
  const tagsRaw = formData.get("tags") as string;
  const tags = tagsRaw ? tagsRaw.split(",").map(t => t.trim()).filter(Boolean) : [];

  const { error } = await supabase
    .from("blog_articles")
    .update({
      silo_id: siloId || null,
      silo_role: siloRole || null,
      silo_group: siloGroup || null,
      category: category || null,
      tags,
    })
    .eq("id", articleId);

  if (error) return { error: error.message };

  // Upsert silo_posts pivot
  if (siloId) {
    await supabase.from("silo_posts").upsert({
      silo_id: siloId,
      article_id: articleId,
      role: siloRole || "SUPPORT",
    }, { onConflict: "silo_id,article_id" });
  }

  revalidatePath("/dashboard/blog");
  return { success: true };
}

// =============================================
// SEO METADATA UPDATE
// =============================================

export async function updateArticleSeo(articleId: string, formData: FormData) {
  const { supabase } = await requireEditorialRole();
  
  const { error } = await supabase
    .from("blog_articles")
    .update({
      meta_title: formData.get("meta_title") as string,
      meta_description: formData.get("meta_description") as string,
      target_keyword: formData.get("target_keyword") as string,
      schema_type: formData.get("schema_type") as string || "article",
      intent: formData.get("intent") as string,
      canonical_path: formData.get("canonical_path") as string,
    })
    .eq("id", articleId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/blog");
  return { success: true };
}
