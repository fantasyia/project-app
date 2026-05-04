-- FantasyIA Mini WordPress schema patch - parte 03A.

CREATE TABLE IF NOT EXISTS public.silo_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  silo_id uuid REFERENCES public.silos(id) ON DELETE CASCADE,
  fingerprint text,
  health_score integer DEFAULT 0,
  status text DEFAULT 'pending',
  summary text,
  issues jsonb DEFAULT '[]'::jsonb,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

ALTER TABLE public.silo_audits ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_silo_audits_silo_id
  ON public.silo_audits(silo_id);

NOTIFY pgrst, 'reload schema';
