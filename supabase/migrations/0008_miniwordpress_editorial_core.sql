-- Mini WordPress editorial core for FantasyIA.
-- Scope: blog/editorial only. This migration intentionally does not touch the
-- private app social `posts` table.

ALTER TABLE "blog_articles"
  ADD COLUMN IF NOT EXISTS "target_keyword" text,
  ADD COLUMN IF NOT EXISTS "focus_keyword" text,
  ADD COLUMN IF NOT EXISTS "meta_title" text,
  ADD COLUMN IF NOT EXISTS "meta_description" text,
  ADD COLUMN IF NOT EXISTS "seo_title" text,
  ADD COLUMN IF NOT EXISTS "canonical_path" text,
  ADD COLUMN IF NOT EXISTS "schema_type" text DEFAULT 'article',
  ADD COLUMN IF NOT EXISTS "supporting_keywords" text[],
  ADD COLUMN IF NOT EXISTS "entities" jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "hero_image_url" text,
  ADD COLUMN IF NOT EXISTS "hero_image_alt" text,
  ADD COLUMN IF NOT EXISTS "og_image_url" text,
  ADD COLUMN IF NOT EXISTS "images" jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "cover_image" jsonb,
  ADD COLUMN IF NOT EXISTS "author_name" text DEFAULT 'Equipe FantasyIA',
  ADD COLUMN IF NOT EXISTS "expert_name" text,
  ADD COLUMN IF NOT EXISTS "expert_role" text,
  ADD COLUMN IF NOT EXISTS "expert_bio" text,
  ADD COLUMN IF NOT EXISTS "expert_credentials" text,
  ADD COLUMN IF NOT EXISTS "reviewed_by" text,
  ADD COLUMN IF NOT EXISTS "reviewed_at" timestamp,
  ADD COLUMN IF NOT EXISTS "sources" jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "disclaimer" text,
  ADD COLUMN IF NOT EXISTS "faq_json" jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "howto_json" jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "content_json" jsonb,
  ADD COLUMN IF NOT EXISTS "content_html" text,
  ADD COLUMN IF NOT EXISTS "published" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "scheduled_at" timestamp,
  ADD COLUMN IF NOT EXISTS "amazon_products" jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "silo_id" uuid,
  ADD COLUMN IF NOT EXISTS "silo_role" text DEFAULT 'SUPPORT',
  ADD COLUMN IF NOT EXISTS "silo_group" text,
  ADD COLUMN IF NOT EXISTS "silo_order" integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "silo_group_order" integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "show_in_silo_menu" boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS "intent" text,
  ADD COLUMN IF NOT EXISTS "category" text,
  ADD COLUMN IF NOT EXISTS "tags" text[],
  ADD COLUMN IF NOT EXISTS "imported_source" text,
  ADD COLUMN IF NOT EXISTS "imported_at" timestamp,
  ADD COLUMN IF NOT EXISTS "raw_payload" jsonb,
  ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now();

UPDATE "blog_articles"
SET
  content_html = COALESCE(content_html, content),
  published = status = 'published',
  cover_image = COALESCE(cover_image, jsonb_build_object('url', cover_image_url))
WHERE content_html IS NULL OR cover_image IS NULL OR published IS NULL;

ALTER TABLE "silos"
  ADD COLUMN IF NOT EXISTS "hero_image_url" text,
  ADD COLUMN IF NOT EXISTS "hero_image_alt" text,
  ADD COLUMN IF NOT EXISTS "pillar_content_json" jsonb,
  ADD COLUMN IF NOT EXISTS "pillar_content_html" text,
  ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now();

CREATE TABLE IF NOT EXISTS "post_links" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "source_article_id" uuid REFERENCES "blog_articles"("id") ON DELETE CASCADE,
  "target_article_id" uuid REFERENCES "blog_articles"("id") ON DELETE SET NULL,
  "target_url" text,
  "anchor_text" text NOT NULL,
  "link_type" text DEFAULT 'internal',
  "rel_flags" text[],
  "is_blank" boolean DEFAULT false,
  "created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "post_link_occurrences" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "silo_id" uuid REFERENCES "silos"("id") ON DELETE SET NULL,
  "source_article_id" uuid REFERENCES "blog_articles"("id") ON DELETE CASCADE,
  "target_article_id" uuid REFERENCES "blog_articles"("id") ON DELETE SET NULL,
  "anchor_text" text,
  "context_snippet" text,
  "position_bucket" text,
  "href_normalized" text,
  "link_type" text DEFAULT 'internal',
  "is_nofollow" boolean DEFAULT false,
  "is_sponsored" boolean DEFAULT false,
  "is_ugc" boolean DEFAULT false,
  "is_blank" boolean DEFAULT false,
  "start_index" integer,
  "end_index" integer,
  "occurrence_key" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "link_audits" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "silo_id" uuid REFERENCES "silos"("id") ON DELETE SET NULL,
  "occurrence_id" uuid REFERENCES "post_link_occurrences"("id") ON DELETE CASCADE,
  "score" integer DEFAULT 0,
  "label" text,
  "reasons" jsonb DEFAULT '[]'::jsonb,
  "suggested_anchor" text,
  "note" text,
  "action" text,
  "recommendation" text,
  "spam_risk" text,
  "intent_match" text,
  "created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "silo_audits" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "silo_id" uuid REFERENCES "silos"("id") ON DELETE CASCADE,
  "fingerprint" text,
  "health_score" integer DEFAULT 0,
  "status" text DEFAULT 'pending',
  "summary" text,
  "issues" jsonb DEFAULT '[]'::jsonb,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "google_cse_settings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "api_key" text,
  "cx" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "wp_app_passwords" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "username" text NOT NULL,
  "display_name" text,
  "password_hash" text NOT NULL,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "wp_id_map" (
  "id" bigserial PRIMARY KEY,
  "entity_type" text NOT NULL,
  "entity_uuid" uuid,
  "entity_key" text,
  "created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "wp_media" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "url" text NOT NULL,
  "alt_text" text,
  "title" text,
  "created_at" timestamp DEFAULT now()
);

CREATE OR REPLACE VIEW "miniwordpress_posts" AS
SELECT
  id,
  silo_id,
  title,
  slug,
  target_keyword,
  focus_keyword,
  meta_title,
  meta_description,
  seo_title,
  canonical_path,
  schema_type,
  supporting_keywords,
  entities,
  COALESCE(hero_image_url, cover_image_url) AS hero_image_url,
  hero_image_alt,
  og_image_url,
  images,
  cover_image,
  author_name,
  expert_name,
  expert_role,
  expert_bio,
  expert_credentials,
  reviewed_by,
  reviewed_at,
  sources,
  disclaimer,
  faq_json,
  howto_json,
  content_json,
  COALESCE(content_html, content) AS content_html,
  status,
  published,
  published_at,
  scheduled_at,
  amazon_products,
  silo_role,
  silo_group,
  silo_order,
  silo_group_order,
  show_in_silo_menu,
  excerpt,
  imported_source,
  imported_at,
  raw_payload,
  created_at,
  updated_at
FROM "blog_articles";

CREATE INDEX IF NOT EXISTS "idx_blog_articles_silo_id" ON "blog_articles"("silo_id");
CREATE INDEX IF NOT EXISTS "idx_blog_articles_status" ON "blog_articles"("status");
CREATE INDEX IF NOT EXISTS "idx_blog_articles_target_keyword" ON "blog_articles"("target_keyword");
CREATE INDEX IF NOT EXISTS "idx_post_links_source_article" ON "post_links"("source_article_id");
CREATE INDEX IF NOT EXISTS "idx_post_link_occurrences_source_article" ON "post_link_occurrences"("source_article_id");
CREATE INDEX IF NOT EXISTS "idx_silo_audits_silo_id" ON "silo_audits"("silo_id");
