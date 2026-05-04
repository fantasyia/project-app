-- FantasyIA Mini WordPress schema patch - parte 02.
-- Links internos e auditorias. Usa blog_articles como origem/destino editorial.

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

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'post_links'
      AND column_name = 'source_article_id'
  ) THEN
    UPDATE "post_links"
    SET source_post_id = COALESCE(source_post_id, source_article_id)
    WHERE source_post_id IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'post_links'
      AND column_name = 'target_article_id'
  ) THEN
    UPDATE "post_links"
    SET target_post_id = COALESCE(target_post_id, target_article_id)
    WHERE target_post_id IS NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'post_link_occurrences'
      AND column_name = 'source_article_id'
  ) THEN
    UPDATE "post_link_occurrences"
    SET source_post_id = COALESCE(source_post_id, source_article_id)
    WHERE source_post_id IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'post_link_occurrences'
      AND column_name = 'target_article_id'
  ) THEN
    UPDATE "post_link_occurrences"
    SET target_post_id = COALESCE(target_post_id, target_article_id)
    WHERE target_post_id IS NULL;
  END IF;
END $$;

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

CREATE INDEX IF NOT EXISTS "idx_post_link_occurrences_source_article" ON "post_link_occurrences"("source_article_id");
CREATE INDEX IF NOT EXISTS "idx_post_link_occurrences_source_post" ON "post_link_occurrences"("source_post_id");
CREATE INDEX IF NOT EXISTS "idx_link_audits_occurrence_id" ON "link_audits"("occurrence_id");

NOTIFY pgrst, 'reload schema';
