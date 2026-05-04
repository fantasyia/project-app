-- FantasyIA Mini WordPress schema patch - parte 03.
-- Tabelas auxiliares do Mini WordPress.

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

CREATE INDEX IF NOT EXISTS "idx_silo_audits_silo_id" ON "silo_audits"("silo_id");

NOTIFY pgrst, 'reload schema';
