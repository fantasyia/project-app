"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireEditorialRole } from "@/lib/auth/rbac";
import { buildPostCanonicalPath } from "@/lib/seo/canonical";

const SaveSchema = z.object({
  id: z.string().uuid(),
  silo_id: z.string().uuid().nullable().optional(),
  silo_role: z.enum(["PILLAR", "SUPPORT", "AUX"]).nullable().optional(),
  silo_position: z.number().int().min(1).max(100).nullable().optional(),
  title: z.string().min(1).max(180),
  seo_title: z.string().max(180).nullable().optional(),
  meta_title: z.string().max(180).nullable().optional(),
  slug: z.string().min(1).max(180),
  target_keyword: z.string().max(180).nullable().optional(),
  supporting_keywords: z.array(z.string()).optional(),
  silo_group: z.string().trim().max(64).nullable().optional(),
  silo_order: z.number().int().min(0).max(999).nullable().optional(),
  silo_group_order: z.number().int().min(0).max(999).nullable().optional(),
  show_in_silo_menu: z.boolean().nullable().optional(),
  replace_existing_pillar: z.boolean().optional(),
  meta_description: z.string().max(800).nullable().optional(),
  canonical_path: z.string().max(220).nullable().optional(),
  entities: z.array(z.string()).optional(),
  schema_type: z.enum(["article", "review", "faq", "howto"]).optional(),
  faq_json: z.any().optional(),
  howto_json: z.any().optional(),
  hero_image_url: z.string().nullable().optional(),
  hero_image_alt: z.string().nullable().optional(),
  og_image_url: z.string().nullable().optional(),
  images: z.any().optional(),
  cover_image: z.any().nullable().optional(),
  author_name: z.string().max(120).nullable().optional(),
  expert_name: z.string().max(120).nullable().optional(),
  expert_role: z.string().max(120).nullable().optional(),
  expert_bio: z.string().max(500).nullable().optional(),
  expert_credentials: z.string().max(240).nullable().optional(),
  reviewed_by: z.string().max(120).nullable().optional(),
  reviewed_at: z.string().nullable().optional(),
  sources: z.any().optional(),
  disclaimer: z.string().max(500).nullable().optional(),
  scheduled_at: z.string().nullable().optional(),
  status: z.enum(["draft", "review", "scheduled", "published"]).optional(),
  content_json: z.any(),
  content_html: z.string(),
  amazon_products: z.any().optional(),
});

function normalizeImageUrl(value: unknown) {
  if (typeof value === "string") return value || null;
  if (value && typeof value === "object" && "url" in value) {
    const url = String((value as { url?: unknown }).url ?? "").trim();
    return url || null;
  }
  return null;
}

async function resolveSiloSlug(
  supabase: Awaited<ReturnType<typeof requireEditorialRole>>["supabase"],
  siloId: string | null | undefined
) {
  if (!siloId) return null;
  const { data } = await supabase.from("silos").select("slug").eq("id", siloId).maybeSingle();
  return data?.slug || null;
}

async function syncSiloPost(
  supabase: Awaited<ReturnType<typeof requireEditorialRole>>["supabase"],
  data: z.infer<typeof SaveSchema>
) {
  if (!data.silo_id) {
    await supabase.from("silo_posts").delete().eq("article_id", data.id);
    return;
  }

  await supabase.from("silo_posts").upsert(
    {
      silo_id: data.silo_id,
      article_id: data.id,
      role: data.silo_role || "SUPPORT",
      position: data.silo_position || data.silo_order || 0,
      level: data.silo_role === "PILLAR" ? 0 : 1,
    },
    { onConflict: "silo_id,article_id" }
  );
}

export async function saveEditorPost(payload: unknown) {
  const { supabase } = await requireEditorialRole();
  const data = SaveSchema.parse(payload);
  const siloSlug = await resolveSiloSlug(supabase, data.silo_id);
  const canonicalPath = data.canonical_path || buildPostCanonicalPath(siloSlug, data.slug) || `/blog/${data.slug}`;
  const coverImageUrl = normalizeImageUrl(data.cover_image) || data.hero_image_url || data.og_image_url || null;
  const publishedAt = data.status === "published" ? new Date().toISOString() : null;

  const { error } = await supabase
    .from("blog_articles")
    .update({
      title: data.title,
      slug: data.slug,
      target_keyword: data.target_keyword || "",
      focus_keyword: data.target_keyword || "",
      supporting_keywords: data.supporting_keywords || [],
      meta_title: data.meta_title || data.seo_title || data.title,
      seo_title: data.seo_title || data.meta_title || data.title,
      meta_description: data.meta_description || null,
      canonical_path: canonicalPath,
      entities: data.entities || [],
      schema_type: data.schema_type || "article",
      faq_json: data.faq_json || [],
      howto_json: data.howto_json || [],
      hero_image_url: data.hero_image_url || coverImageUrl,
      hero_image_alt: data.hero_image_alt || "",
      og_image_url: data.og_image_url || coverImageUrl,
      images: data.images || [],
      cover_image: data.cover_image || (coverImageUrl ? { url: coverImageUrl } : null),
      cover_image_url: coverImageUrl,
      author_name: data.author_name || "Equipe FantasyIA",
      expert_name: data.expert_name || data.author_name || "Equipe FantasyIA",
      expert_role: data.expert_role || "Equipe editorial",
      expert_bio: data.expert_bio || null,
      expert_credentials: data.expert_credentials || null,
      reviewed_by: data.reviewed_by || null,
      reviewed_at: data.reviewed_at || null,
      sources: data.sources || [],
      disclaimer: data.disclaimer || null,
      scheduled_at: data.scheduled_at || null,
      status: data.status || "draft",
      published: data.status === "published",
      published_at: publishedAt,
      content_json: data.content_json,
      content_html: data.content_html,
      content: data.content_html,
      amazon_products: data.amazon_products || [],
      silo_id: data.silo_id || null,
      silo_role: data.silo_role || "SUPPORT",
      silo_group: data.silo_group || null,
      silo_order: data.silo_order || 0,
      silo_group_order: data.silo_group_order || 0,
      show_in_silo_menu: data.show_in_silo_menu ?? true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.id);

  if (error) throw new Error(error.message);

  await syncSiloPost(supabase, data);

  revalidatePath("/dashboard/blog");
  revalidatePath(`/dashboard/blog/editor/${data.id}`);
  revalidatePath("/blog");
  revalidatePath(`/blog/${data.slug}`);
  if (siloSlug) revalidatePath(`/blog/s/${siloSlug}`);
}
