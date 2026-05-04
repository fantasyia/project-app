-- FantasyIA Mini WordPress schema patch - parte 01.
-- Escopo: somente tabelas editoriais/blog. Nao altera a tabela social public.posts.

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

NOTIFY pgrst, 'reload schema';
