-- FantasyIA Mini WordPress schema patch - parte 03B.

CREATE TABLE IF NOT EXISTS public.google_cse_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key text,
  cx text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wp_app_passwords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  display_name text,
  password_hash text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wp_id_map (
  id bigserial PRIMARY KEY,
  entity_type text NOT NULL,
  entity_uuid uuid,
  entity_key text,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wp_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  alt_text text,
  title text,
  created_at timestamp DEFAULT now()
);

ALTER TABLE public.google_cse_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wp_app_passwords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wp_id_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wp_media ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
