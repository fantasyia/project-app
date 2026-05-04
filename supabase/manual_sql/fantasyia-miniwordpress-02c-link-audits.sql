-- FantasyIA Mini WordPress schema patch - parte 02C.
-- Cria a tabela de auditoria dos links internos.

CREATE TABLE IF NOT EXISTS public.link_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  silo_id uuid REFERENCES public.silos(id) ON DELETE SET NULL,
  occurrence_id uuid REFERENCES public.post_link_occurrences(id) ON DELETE CASCADE,
  score integer DEFAULT 0,
  label text,
  reasons text[],
  suggested_anchor text,
  note text,
  action text,
  recommendation text,
  spam_risk text,
  intent_match text,
  created_at timestamp DEFAULT now()
);

ALTER TABLE public.link_audits ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_link_audits_occurrence_id
  ON public.link_audits(occurrence_id);

NOTIFY pgrst, 'reload schema';
