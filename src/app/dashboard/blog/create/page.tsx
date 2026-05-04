import { redirect } from "next/navigation";
import { requireEditorialRole } from "@/lib/auth/rbac";
import { getSilos } from "@/lib/actions/silo";

export const metadata = { title: "Novo post | Mini WordPress | FantasyIA" };

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export default async function CreateArticlePage() {
  const { user, supabase } = await requireEditorialRole();
  const silos = await getSilos().catch(() => []);
  const title = "Novo post";
  const slug = `${slugify(title)}-${Date.now().toString(36)}`;

  const { data, error } = await supabase
    .from("blog_articles")
    .insert({
      author_id: user.id,
      title,
      slug,
      excerpt: "Rascunho editorial em producao.",
      content: "<p>Comece o artigo aqui.</p>",
      content_html: "<p>Comece o artigo aqui.</p>",
      content_json: null,
      status: "draft",
      published: false,
      target_keyword: "keyword base",
      focus_keyword: "keyword base",
      meta_title: title,
      seo_title: title,
      meta_description: null,
      schema_type: "article",
      supporting_keywords: [],
      entities: [],
      images: [],
      sources: [],
      faq_json: [],
      howto_json: [],
      amazon_products: [],
      silo_id: silos[0]?.id || null,
      silo_role: "SUPPORT",
      silo_order: 0,
      silo_group_order: 0,
      show_in_silo_menu: true,
      author_name: "Equipe FantasyIA",
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Falha ao criar rascunho editorial: ${error.message}`);
  }

  redirect(`/dashboard/blog/editor/${data.id}`);
}
