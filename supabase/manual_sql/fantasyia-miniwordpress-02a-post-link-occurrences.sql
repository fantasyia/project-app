-- FantasyIA Mini WordPress schema patch - parte 02A.
-- Cria a tabela de ocorrencias de links do editor.

CREATE TABLE IF NOT EXISTS public.post_link_occurrences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  silo_id uuid REFERENCES public.silos(id) ON DELETE SET NULL,
  source_article_id uuid REFERENCES public.blog_articles(id) ON DELETE CASCADE,
  target_article_id uuid REFERENCES public.blog_articles(id) ON DELETE SET NULL,
  source_post_id uuid REFERENCES public.blog_articles(id) ON DELETE CASCADE,
  target_post_id uuid REFERENCES public.blog_articles(id) ON DELETE SET NULL,
  anchor_text text,
  context_snippet text,
  position_bucket text,
  href_normalized text,
  link_type text DEFAULT 'internal',
  is_nofollow boolean DEFAULT false,
  is_sponsored boolean DEFAULT false,
  is_ugc boolean DEFAULT false,
  is_blank boolean DEFAULT false,
  start_index integer,
  end_index integer,
  occurrence_key text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

ALTER TABLE public.post_link_occurrences ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_post_link_occurrences_source_post
  ON public.post_link_occurrences(source_post_id);

CREATE INDEX IF NOT EXISTS idx_post_link_occurrences_source_article
  ON public.post_link_occurrences(source_article_id);

NOTIFY pgrst, 'reload schema';
