"use server";

import { contentToPlainText } from "@/lib/blog/content";
import type { BlogArticleRecord } from "@/lib/blog/types";
import { requireEditorialRole } from "@/lib/auth/rbac";
import { revalidatePath } from "next/cache";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function isRecoverableInsertError(message?: string) {
  if (!message) return false;

  return (
    message.includes("Could not find the") ||
    message.includes("column") ||
    message.includes("silos") ||
    message.includes("silo_posts")
  );
}

type ArticleMutationInput = {
  title: string;
  content: string;
  excerpt: string;
  targetKeyword: string;
  metaTitle: string;
  metaDescription: string;
  canonicalPath: string;
  siloId: string | null;
  siloRole: string;
  siloGroup: string;
  category: string;
  tags: string[];
  intent: string;
  schemaType: string;
};

async function resolveSiloId(
  supabase: Awaited<ReturnType<typeof requireEditorialRole>>["supabase"],
  siloId: string | null,
  siloSlug: string
) {
  if (siloId) return siloId;
  if (!siloSlug) return null;

  const { data: siloData, error: siloError } = await supabase
    .from("silos")
    .select("id")
    .eq("slug", siloSlug)
    .maybeSingle();

  if (siloError) return null;
  return siloData?.id || null;
}

async function resolveSiloSlug(
  supabase: Awaited<ReturnType<typeof requireEditorialRole>>["supabase"],
  siloId: string | null
) {
  if (!siloId) return null;

  const { data: siloData, error: siloError } = await supabase
    .from("silos")
    .select("slug")
    .eq("id", siloId)
    .maybeSingle();

  if (siloError) return null;
  return siloData?.slug || null;
}

function buildArticlePayload(
  authorId: string,
  slug: string,
  coverUrl: string | null,
  input: ArticleMutationInput,
  status: string
) {
  const plainTextContent = contentToPlainText(input.content);
  const excerpt =
    input.excerpt || plainTextContent.slice(0, 180) || "Artigo editorial em producao.";

  const basePayload = {
    author_id: authorId,
    title: input.title,
    slug,
    content: input.content,
    excerpt,
    cover_image_url: coverUrl,
    status,
  };

  const extendedPayload = {
    ...basePayload,
    meta_title: input.metaTitle || null,
    meta_description: input.metaDescription || null,
    target_keyword: input.targetKeyword || null,
    canonical_path: input.canonicalPath || null,
    schema_type: input.schemaType || null,
    intent: input.intent || null,
    silo_id: input.siloId,
    silo_role: input.siloRole || null,
    silo_group: input.siloGroup || null,
    category: input.category || null,
    tags: input.tags.length > 0 ? input.tags : null,
  };

  return { basePayload, extendedPayload };
}

async function syncSiloPivot(
  supabase: Awaited<ReturnType<typeof requireEditorialRole>>["supabase"],
  articleId: string,
  siloId: string | null,
  siloRole: string
) {
  if (!siloId) {
    await supabase.from("silo_posts").delete().eq("article_id", articleId);
    return;
  }

  await supabase.from("silo_posts").upsert(
    {
      silo_id: siloId,
      article_id: articleId,
      role: siloRole || "SUPPORT",
    },
    { onConflict: "silo_id,article_id" }
  );
}

export async function createArticle(formData: FormData) {
  const { user, supabase } = await requireEditorialRole();
  const title = (formData.get("title") as string)?.trim();
  const content = (formData.get("content") as string)?.trim();
  const excerpt = ((formData.get("excerpt") as string) || "").trim();
  const file = formData.get("cover") as File | null;
  const targetKeyword = ((formData.get("target_keyword") as string) || "").trim();
  const metaTitle = ((formData.get("meta_title") as string) || title).trim();
  const metaDescription = ((formData.get("meta_description") as string) || excerpt).trim();
  const canonicalPath = ((formData.get("canonical_path") as string) || "").trim();
  const rawSiloId = formData.get("silo_id");
  const formSiloId = ((rawSiloId as string) || "").trim();
  const siloSlug = ((formData.get("silo_slug") as string) || "").trim();
  const siloRole = ((formData.get("silo_role") as string) || "").trim();
  const siloGroup = ((formData.get("silo_group") as string) || "").trim();
  const category = ((formData.get("category") as string) || "").trim();
  const tags = ((formData.get("tags") as string) || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  const intent = ((formData.get("intent") as string) || "").trim();
  const schemaType = ((formData.get("schema_type") as string) || "article").trim();

  if (!title || !content) {
    return { error: "Titulo e conteudo sao obrigatorios." };
  }

  const slug = slugify(title);

  let coverUrl: string | null = null;

  if (file && file.size > 0) {
    const ext = file.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("blog-media").upload(fileName, file);
    if (uploadError) return { error: uploadError.message };
    const { data: urlData } = supabase.storage.from("blog-media").getPublicUrl(fileName);
    coverUrl = urlData.publicUrl;
  }

  const articleSlug = `${slug}-${Date.now().toString(36)}`;
  const siloId = await resolveSiloId(supabase, formSiloId || null, siloSlug);
  const { basePayload, extendedPayload } = buildArticlePayload(user.id, articleSlug, coverUrl, {
    title,
    content,
    excerpt,
    targetKeyword,
    metaTitle,
    metaDescription,
    canonicalPath,
    siloId,
    siloRole,
    siloGroup,
    category,
    tags,
    intent,
    schemaType,
  }, "draft");

  let insertedArticleId: string | null = null;

  let { data: insertData, error } = await supabase
    .from("blog_articles")
    .insert(extendedPayload)
    .select("id")
    .single();

  if (error && isRecoverableInsertError(error.message)) {
    const fallbackInsert = await supabase
      .from("blog_articles")
      .insert(basePayload)
      .select("id")
      .single();

    insertData = fallbackInsert.data;
    error = fallbackInsert.error;
  }

  if (error) return { error: error.message };

  insertedArticleId = insertData?.id || null;

  if (insertedArticleId) {
    await syncSiloPivot(supabase, insertedArticleId, siloId, siloRole);
  }

  revalidatePath("/dashboard/blog");
  revalidatePath("/blog");
  if (siloSlug) revalidatePath(`/blog/s/${siloSlug}`);
  return { success: true };
}

export async function getArticleByIdForEditor(articleId: string) {
  const { supabase } = await requireEditorialRole();

  const { data, error } = await supabase
    .from("blog_articles")
    .select("*")
    .eq("id", articleId)
    .maybeSingle();

  if (error) return null;
  return (data || null) as BlogArticleRecord | null;
}

export async function updateArticle(articleId: string, formData: FormData) {
  const { user, supabase } = await requireEditorialRole();
  const title = (formData.get("title") as string)?.trim();
  const content = (formData.get("content") as string)?.trim();
  const excerpt = ((formData.get("excerpt") as string) || "").trim();
  const file = formData.get("cover") as File | null;
  const existingCover = ((formData.get("existing_cover_url") as string) || "").trim();
  const targetKeyword = ((formData.get("target_keyword") as string) || "").trim();
  const metaTitle = ((formData.get("meta_title") as string) || title).trim();
  const metaDescription = ((formData.get("meta_description") as string) || excerpt).trim();
  const canonicalPath = ((formData.get("canonical_path") as string) || "").trim();
  const rawSiloId = formData.get("silo_id");
  const formSiloId = ((rawSiloId as string) || "").trim();
  const siloSlug = ((formData.get("silo_slug") as string) || "").trim();
  const siloRole = ((formData.get("silo_role") as string) || "").trim();
  const siloGroup = ((formData.get("silo_group") as string) || "").trim();
  const category = ((formData.get("category") as string) || "").trim();
  const tags = ((formData.get("tags") as string) || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  const intent = ((formData.get("intent") as string) || "").trim();
  const schemaType = ((formData.get("schema_type") as string) || "article").trim();

  if (!title || !content) {
    return { error: "Titulo e conteudo sao obrigatorios." };
  }

  const currentArticle = await getArticleByIdForEditor(articleId);
  if (!currentArticle) return { error: "Artigo nao encontrado." };

  const slug = currentArticle.slug || `${slugify(title)}-${Date.now().toString(36)}`;

  let coverUrl: string | null = existingCover || currentArticle.cover_image_url || null;
  const previousSiloSlug = await resolveSiloSlug(supabase, currentArticle.silo_id || null);

  if (file && file.size > 0) {
    const ext = file.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("blog-media").upload(fileName, file);
    if (uploadError) return { error: uploadError.message };
    const { data: urlData } = supabase.storage.from("blog-media").getPublicUrl(fileName);
    coverUrl = urlData.publicUrl;
  }

  const nextSiloId = rawSiloId !== null ? (formSiloId || null) : (currentArticle.silo_id || null);
  const siloId = await resolveSiloId(supabase, nextSiloId, siloSlug);
  const { basePayload, extendedPayload } = buildArticlePayload(currentArticle.author_id || user.id, slug, coverUrl, {
    title,
    content,
    excerpt,
    targetKeyword,
    metaTitle,
    metaDescription,
    canonicalPath,
    siloId,
    siloRole,
    siloGroup,
    category,
    tags,
    intent,
    schemaType,
  }, currentArticle.status || "draft");

  let { error } = await supabase
    .from("blog_articles")
    .update(extendedPayload)
    .eq("id", articleId);

  if (error && isRecoverableInsertError(error.message)) {
    const fallbackUpdate = await supabase
      .from("blog_articles")
      .update(basePayload)
      .eq("id", articleId);

    error = fallbackUpdate.error;
  }

  if (error) return { error: error.message };

  await syncSiloPivot(supabase, articleId, siloId, siloRole);

  revalidatePath("/dashboard/blog");
  revalidatePath(`/dashboard/blog/${articleId}/edit`);
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  if (previousSiloSlug) revalidatePath(`/blog/s/${previousSiloSlug}`);
  if (siloSlug) revalidatePath(`/blog/s/${siloSlug}`);
  return { success: true };
}

export async function publishArticle(articleId: string) {
  const { supabase } = await requireEditorialRole();
  const article = await getArticleByIdForEditor(articleId);

  const { error } = await supabase
    .from("blog_articles")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", articleId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/blog");
  revalidatePath("/blog");
  if (article?.slug) revalidatePath(`/blog/${article.slug}`);
  const siloSlug = await resolveSiloSlug(supabase, article?.silo_id || null);
  if (siloSlug) revalidatePath(`/blog/s/${siloSlug}`);
  return { success: true };
}

export async function getMyArticles() {
  const { user, supabase } = await requireEditorialRole();

  const { data } = await supabase
    .from("blog_articles")
    .select("*")
    .eq("author_id", user.id)
    .order("created_at", { ascending: false });

  return (data || []) as BlogArticleRecord[];
}

export async function getEditorArticles() {
  const { supabase } = await requireEditorialRole();

  const { data } = await supabase
    .from("blog_articles")
    .select("*")
    .order("updated_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  return (data || []) as BlogArticleRecord[];
}

export async function unpublishArticle(articleId: string) {
  const { supabase } = await requireEditorialRole();
  const article = await getArticleByIdForEditor(articleId);

  const { error } = await supabase
    .from("blog_articles")
    .update({ status: "draft", published_at: null })
    .eq("id", articleId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/blog");
  revalidatePath("/blog");
  if (article?.slug) revalidatePath(`/blog/${article.slug}`);
  return { success: true };
}

export async function deleteArticle(articleId: string) {
  const { user, supabase } = await requireEditorialRole();
  const article = await getArticleByIdForEditor(articleId);

  const { error } = await supabase
    .from("blog_articles")
    .delete()
    .eq("id", articleId)
    .eq("author_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/blog");
  revalidatePath("/blog");
  if (article?.slug) revalidatePath(`/blog/${article.slug}`);
  const siloSlug = await resolveSiloSlug(supabase, article?.silo_id || null);
  if (siloSlug) revalidatePath(`/blog/s/${siloSlug}`);
  return { success: true };
}

// === Public Queries (no auth required) ===

export async function getPublishedArticles() {
  const supabase = (await import("@/lib/supabase/server")).createClient();
  const db = await supabase;

  let { data, error } = await db
    .from("blog_articles")
    .select("*, author:users!blog_articles_author_id_users_id_fk(display_name, handle)")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(30);

  if (error) {
    const fallback = await db
      .from("blog_articles")
      .select("*, author:users(display_name, handle)")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(30);

    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    console.error("getPublishedArticles error:", error.message);
    return [];
  }

  return (data || []) as BlogArticleRecord[];
}

export async function getArticleBySlug(slug: string) {
  const supabase = (await import("@/lib/supabase/server")).createClient();
  const db = await supabase;

  let { data, error } = await db
    .from("blog_articles")
    .select("*, author:users!blog_articles_author_id_users_id_fk(display_name, handle, avatar_url)")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    const fallback = await db
      .from("blog_articles")
      .select("*, author:users(display_name, handle, avatar_url)")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    console.error("getArticleBySlug error:", error.message);
    return null;
  }

  return (data || null) as BlogArticleRecord | null;
}
