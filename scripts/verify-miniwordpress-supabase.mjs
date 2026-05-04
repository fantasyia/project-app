import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("[miniwordpress:verify] Missing NEXT_PUBLIC_SUPABASE_URL or Supabase key.");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const checks = {
  blog_articles: [
    "target_keyword",
    "focus_keyword",
    "meta_title",
    "meta_description",
    "seo_title",
    "canonical_path",
    "schema_type",
    "supporting_keywords",
    "entities",
    "hero_image_url",
    "hero_image_alt",
    "og_image_url",
    "images",
    "cover_image",
    "author_name",
    "expert_name",
    "expert_role",
    "expert_bio",
    "expert_credentials",
    "reviewed_by",
    "reviewed_at",
    "sources",
    "disclaimer",
    "faq_json",
    "howto_json",
    "content_json",
    "content_html",
    "published",
    "scheduled_at",
    "amazon_products",
    "silo_id",
    "silo_role",
    "silo_group",
    "silo_order",
    "silo_group_order",
    "show_in_silo_menu",
    "intent",
    "category",
    "tags",
    "imported_source",
    "imported_at",
    "raw_payload",
    "updated_at",
  ],
  silos: ["hero_image_url", "hero_image_alt", "pillar_content_json", "pillar_content_html", "show_in_navigation", "updated_at"],
  silo_groups: ["id", "silo_id", "key", "label", "menu_order", "keywords"],
  silo_posts: ["silo_id", "article_id", "role", "position", "level", "parent_article_id"],
  post_links: ["id", "source_post_id", "target_post_id"],
  post_link_occurrences: ["id", "source_post_id", "target_post_id", "occurrence_key", "start_index", "end_index"],
  link_audits: ["id", "action", "recommendation", "spam_risk", "intent_match"],
  silo_audits: ["id", "updated_at"],
  google_cse_settings: ["id"],
  wp_app_passwords: ["id"],
  wp_id_map: ["id"],
  wp_media: ["id"],
};

const missing = [];

for (const [table, columns] of Object.entries(checks)) {
  for (const column of columns) {
    const { error } = await supabase.from(table).select(column).limit(1);
    if (error) missing.push(`${table}.${column}: ${error.message}`);
  }
}

if (missing.length > 0) {
  console.error("[miniwordpress:verify] Missing schema pieces:");
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log("[miniwordpress:verify] OK: Mini WordPress schema is present.");
