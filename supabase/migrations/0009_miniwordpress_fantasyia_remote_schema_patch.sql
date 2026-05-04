-- Mini WordPress FantasyIA remote schema patch.
-- Scope: editorial/blog only. Does not touch the private social posts table.
-- Safe to run more than once in Supabase SQL Editor.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER TABLE "blog_articles"
  ADD COLUMN IF NOT EXISTS "focus_keyword" text,
  ADD COLUMN IF NOT EXISTS "seo_title" text,
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
  ADD COLUMN IF NOT EXISTS "silo_group_order" integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "show_in_silo_menu" boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS "imported_source" text,
  ADD COLUMN IF NOT EXISTS "imported_at" timestamp,
  ADD COLUMN IF NOT EXISTS "raw_payload" jsonb;

ALTER TABLE "silos"
  ADD COLUMN IF NOT EXISTS "pillar_content_json" jsonb,
  ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now();

UPDATE "blog_articles"
SET
  content_html = COALESCE(content_html, content),
  published = COALESCE(published, status = 'published'),
  cover_image = COALESCE(cover_image, jsonb_build_object('url', cover_image_url))
WHERE content_html IS NULL OR published IS NULL OR cover_image IS NULL;

CREATE TABLE IF NOT EXISTS "post_link_occurrences" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "silo_id" uuid REFERENCES "silos"("id") ON DELETE SET NULL,
  "source_article_id" uuid REFERENCES "blog_articles"("id") ON DELETE CASCADE,
  "target_article_id" uuid REFERENCES "blog_articles"("id") ON DELETE SET NULL,
  "source_post_id" uuid REFERENCES "blog_articles"("id") ON DELETE CASCADE,
  "target_post_id" uuid REFERENCES "blog_articles"("id") ON DELETE SET NULL,
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

ALTER TABLE "post_links"
  ADD COLUMN IF NOT EXISTS "source_post_id" uuid REFERENCES "blog_articles"("id") ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS "target_post_id" uuid REFERENCES "blog_articles"("id") ON DELETE SET NULL;

ALTER TABLE "post_link_occurrences"
  ADD COLUMN IF NOT EXISTS "source_post_id" uuid REFERENCES "blog_articles"("id") ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS "target_post_id" uuid REFERENCES "blog_articles"("id") ON DELETE SET NULL;

UPDATE "post_links"
SET
  source_post_id = COALESCE(source_post_id, source_article_id),
  target_post_id = COALESCE(target_post_id, target_article_id)
WHERE source_post_id IS NULL OR target_post_id IS NULL;

UPDATE "post_link_occurrences"
SET
  source_post_id = COALESCE(source_post_id, source_article_id),
  target_post_id = COALESCE(target_post_id, target_article_id)
WHERE source_post_id IS NULL OR target_post_id IS NULL;

CREATE TABLE IF NOT EXISTS "link_audits" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "silo_id" uuid REFERENCES "silos"("id") ON DELETE SET NULL,
  "occurrence_id" uuid REFERENCES "post_link_occurrences"("id") ON DELETE CASCADE,
  "score" integer DEFAULT 0,
  "label" text,
  "reasons" text[],
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

CREATE INDEX IF NOT EXISTS "idx_post_link_occurrences_source_article" ON "post_link_occurrences"("source_article_id");
CREATE INDEX IF NOT EXISTS "idx_post_link_occurrences_source_post" ON "post_link_occurrences"("source_post_id");
CREATE INDEX IF NOT EXISTS "idx_link_audits_occurrence_id" ON "link_audits"("occurrence_id");
CREATE INDEX IF NOT EXISTS "idx_silo_audits_silo_id" ON "silo_audits"("silo_id");

NOTIFY pgrst, 'reload schema';
