-- FantasyIA Mini WordPress schema patch - parte 02B.
-- Adiciona aliases de compatibilidade esperados pelo editor original.

ALTER TABLE public.post_links
  ADD COLUMN IF NOT EXISTS source_post_id uuid REFERENCES public.blog_articles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS target_post_id uuid REFERENCES public.blog_articles(id) ON DELETE SET NULL;

NOTIFY pgrst, 'reload schema';
