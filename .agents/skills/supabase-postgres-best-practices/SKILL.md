---
name: supabase-postgres-best-practices
description: >
  Postgres performance optimization and best practices from Supabase.
  Use this skill when writing, reviewing, or optimizing Postgres queries, schema designs, or database configurations.
  ALSO contains the complete, canonical SQL migration plan for the Multi-Silo Blog CMS — use when replicating or extending this blog database in a new Supabase project.
license: MIT
metadata:
  author: supabase + blog-cms-preset
  version: "2.0.0"
  organization: Supabase
  date: April 2026
  abstract: >
    Part 1 — Comprehensive Postgres performance optimization guide (queries, indexes, RLS, connections).
    Part 2 — Canonical SQL migration plan for the Multi-Silo Blog CMS (silos, posts, silo_posts,
    silo_groups, post_links, post_link_occurrences, silo_audits, link_audits). Includes
    all migrations in the order they were applied in the production project, plus a single
    consolidated "fresh install" script for new projects.
---

# Supabase Postgres Best Practices + Blog CMS Schema

---

## FantasyIA Project Override

No contexto do FantasyIA:
- use a Parte 1 como guia de performance e modelagem para qualquer schema Postgres;
- use a Parte 2 como schema canônico do **blog/editorial Multi-Silo**;
- nao aplicar automaticamente tabelas do blog ao dominio principal do app privado;
- para subscriber, creator, assinatura, PPV, chat, afiliados e ledger, a fonte de verdade continua sendo `../project-plaintext-context/SKILL.md` e os artefatos em `../../../docs/sdd/`.

---

## PART 1 — Postgres Performance Optimization

Comprehensive performance optimization guide for Postgres, maintained by Supabase. Contains rules across 8 categories, prioritized by impact to guide automated query optimization and schema design.

### When to Apply

Reference these guidelines when:
- Writing SQL queries or designing schemas
- Implementing indexes or query optimization
- Reviewing database performance issues
- Configuring connection pooling or scaling
- Optimizing for Postgres-specific features
- Working with Row-Level Security (RLS)

### Rule Categories by Priority

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Query Performance | CRITICAL | `query-` |
| 2 | Connection Management | CRITICAL | `conn-` |
| 3 | Security & RLS | CRITICAL | `security-` |
| 4 | Schema Design | HIGH | `schema-` |
| 5 | Concurrency & Locking | MEDIUM-HIGH | `lock-` |
| 6 | Data Access Patterns | MEDIUM | `data-` |
| 7 | Monitoring & Diagnostics | LOW-MEDIUM | `monitor-` |
| 8 | Advanced Features | LOW | `advanced-` |

### How to Use

Read individual rule files for detailed explanations and SQL examples:

```
references/query-missing-indexes.md
references/schema-partial-indexes.md
references/_sections.md
```

Each rule file contains:
- Brief explanation of why it matters
- Incorrect SQL example with explanation
- Correct SQL example with explanation
- Optional EXPLAIN output or metrics
- Additional context and references
- Supabase-specific notes (when applicable)

### References

- https://www.postgresql.org/docs/current/
- https://supabase.com/docs
- https://wiki.postgresql.org/wiki/Performance_Optimization
- https://supabase.com/docs/guides/database/overview
- https://supabase.com/docs/guides/auth/row-level-security

---

## PART 2 — Blog CMS: Canonical Database Schema

> Este bloco documenta o schema completo do sistema Multi-Silo Blog CMS.
> Use-o para replicar a estrutura em qualquer projeto Supabase zerado.
> É agnóstico ao nicho — substitua apenas os dados de seed.

### Tabelas do Blog (visão geral)

| Tabela | Função |
|--------|--------|
| `silos` | Categorias-mãe (hubs temáticos). Cada silo = 1 rota `/{silo}` |
| `posts` | Artigos com todos os campos SEO, hierarquia e conteúdo |
| `silo_posts` | Pivot de hierarquia (PILLAR / SUPPORT / AUX) dentro do silo |
| `silo_groups` | Grupos editoriais (Decisão, Preço, Tipos, Uso, Marcas, Resultados) |
| `post_links` | Índice de links internos/externos extraídos do HTML |
| `post_link_occurrences` | Ocorrências granulares de links (posição, âncora, contexto) |
| `silo_audits` | Cache de auditoria de saúde do silo (score 0-100) |
| `link_audits` | Auditoria de qualidade por link individual |

### Tabelas auxiliares (geradas por migrations específicas)

| Tabela | Função |
|--------|--------|
| `silo_batches` / `silo_batch_posts` | Agrupamento de posts em lotes editoriais |
| `serp_cache` | Cache de resultados SERP (Google CSE) |
| `google_cse_settings` | Configurações de integração com Google CSE |

---

## MIGRATION PLAN — Ordem de Execução (Projeto Zerado)

Execute **em ordem** no Supabase SQL Editor ou via CLI.

---

### MIGRATION 00 — Extensão + Tabelas Core

**Execute primeiro. Cria silos e posts com schema mínimo.**

```sql
-- M-00: Bootstrap core tables
-- Arquivo original: supabase/migrations/20260121_00_bootstrap_core_tables.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.silos (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  slug        TEXT        NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.posts (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  silo_id              UUID        REFERENCES public.silos(id) ON DELETE SET NULL,
  title                TEXT        NOT NULL,
  slug                 TEXT        NOT NULL UNIQUE,
  target_keyword       TEXT        NOT NULL,
  content_json         JSONB,
  content_html         TEXT,
  seo_score            INTEGER     DEFAULT 0,
  supporting_keywords  TEXT[]      DEFAULT '{}'::TEXT[],
  meta_description     TEXT,
  seo_title            TEXT,
  cover_image          TEXT,
  intent               TEXT,
  pillar_rank          INTEGER     DEFAULT 0,
  is_featured          BOOLEAN     DEFAULT FALSE,
  amazon_products      JSONB       DEFAULT '[]'::JSONB,
  published            BOOLEAN     DEFAULT FALSE,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS posts_silo_id_idx    ON public.posts (silo_id);
CREATE INDEX IF NOT EXISTS posts_updated_at_idx ON public.posts (updated_at DESC);

NOTIFY pgrst, 'reload schema';
```

---

### MIGRATION 01 — Campos Completos de Editor e SEO

**Adiciona todos os campos do editor Tiptap, SEO e metadados ao posts.**

```sql
-- M-01: Full post editor + SEO fields
-- Arquivo original: supabase/migrations/20260122_01_add_post_editor_fields.sql

ALTER TABLE IF EXISTS public.posts
  ADD COLUMN IF NOT EXISTS meta_title           TEXT,
  ADD COLUMN IF NOT EXISTS canonical_path       TEXT,
  ADD COLUMN IF NOT EXISTS entities             TEXT[]     DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS faq_json             JSONB,
  ADD COLUMN IF NOT EXISTS howto_json           JSONB,
  ADD COLUMN IF NOT EXISTS schema_type          TEXT       NOT NULL DEFAULT 'article',
  ADD COLUMN IF NOT EXISTS hero_image_url       TEXT,
  ADD COLUMN IF NOT EXISTS hero_image_alt       TEXT,
  ADD COLUMN IF NOT EXISTS og_image_url         TEXT,
  ADD COLUMN IF NOT EXISTS images               JSONB      DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS silo_role            TEXT,
  ADD COLUMN IF NOT EXISTS silo_group           TEXT,
  ADD COLUMN IF NOT EXISTS silo_order           INT        DEFAULT 0,
  ADD COLUMN IF NOT EXISTS silo_group_order     INT        DEFAULT 0,
  ADD COLUMN IF NOT EXISTS show_in_silo_menu    BOOLEAN    DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS author_name          TEXT,
  ADD COLUMN IF NOT EXISTS expert_name          TEXT,
  ADD COLUMN IF NOT EXISTS expert_role          TEXT,
  ADD COLUMN IF NOT EXISTS expert_bio           TEXT,
  ADD COLUMN IF NOT EXISTS expert_credentials   TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_by          TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_at          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sources              JSONB      DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS disclaimer           TEXT,
  ADD COLUMN IF NOT EXISTS status               TEXT       NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS published_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS scheduled_at         TIMESTAMPTZ;

-- Constraints
ALTER TABLE public.posts
  ADD CONSTRAINT IF NOT EXISTS posts_status_check
  CHECK (status IN ('draft', 'review', 'scheduled', 'published'));

ALTER TABLE public.posts
  ADD CONSTRAINT IF NOT EXISTS posts_schema_type_check
  CHECK (schema_type IN ('article', 'review', 'faq', 'howto'));

ALTER TABLE public.posts
  ADD CONSTRAINT IF NOT EXISTS posts_published_status_check
  CHECK (
    (status = 'published' AND published = TRUE) OR
    (status <> 'published' AND published = FALSE)
  );

CREATE INDEX IF NOT EXISTS posts_status_idx       ON public.posts (status);
CREATE INDEX IF NOT EXISTS posts_scheduled_at_idx ON public.posts (scheduled_at);

NOTIFY pgrst, 'reload schema';
```

---

### MIGRATION 02 — Campos Completos de silos

**Adiciona campos de SEO, conteúdo pilar e navegação à tabela silos.**

```sql
-- M-02: Full silos fields
-- Arquivo original: supabase/migrations/20260123_01_sync_posts_schema.sql

ALTER TABLE IF EXISTS public.silos
  ADD COLUMN IF NOT EXISTS meta_title          TEXT,
  ADD COLUMN IF NOT EXISTS meta_description    TEXT,
  ADD COLUMN IF NOT EXISTS hero_image_url      TEXT,
  ADD COLUMN IF NOT EXISTS hero_image_alt      TEXT,
  ADD COLUMN IF NOT EXISTS pillar_content_json JSONB,
  ADD COLUMN IF NOT EXISTS pillar_content_html TEXT,
  ADD COLUMN IF NOT EXISTS menu_order          INT     DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active           BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS show_in_navigation  BOOLEAN DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_silos_public_navigation
  ON public.silos (is_active, show_in_navigation, menu_order);

NOTIFY pgrst, 'reload schema';
```

---

### MIGRATION 03 — Tabelas Auxiliares (Batches + post_links)

**Cria silo_batches, silo_batch_posts e post_links.**

```sql
-- M-03: Batches + post_links
-- Arquivo original: supabase/migrations/20260124_01_guardian_silo.sql + supabase/schema.sql

CREATE TABLE IF NOT EXISTS public.silo_batches (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  silo_id    UUID        REFERENCES public.silos(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  status     TEXT        NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.silo_batch_posts (
  batch_id   UUID        REFERENCES public.silo_batches(id) ON DELETE CASCADE,
  post_id    UUID        REFERENCES public.posts(id) ON DELETE CASCADE,
  position   INTEGER     NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (batch_id, post_id)
);

CREATE TABLE IF NOT EXISTS public.post_links (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  source_post_id UUID        REFERENCES public.posts(id) ON DELETE CASCADE,
  target_post_id UUID        REFERENCES public.posts(id) ON DELETE SET NULL,
  target_url     TEXT,
  anchor_text    TEXT,
  link_type      TEXT        NOT NULL,
  rel_flags      TEXT[]      DEFAULT '{}'::TEXT[],
  is_blank       BOOLEAN     DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS post_links_source_idx   ON public.post_links (source_post_id);
CREATE INDEX IF NOT EXISTS post_links_target_idx   ON public.post_links (target_post_id);
CREATE INDEX IF NOT EXISTS silo_batches_silo_idx   ON public.silo_batches (silo_id);

NOTIFY pgrst, 'reload schema';
```

---

### MIGRATION 04 — Pilar do Silo (Unique PILLAR)

**Garante que só existe 1 post PILLAR por silo.**

```sql
-- M-04: Unique PILLAR per silo
-- Arquivo original: supabase/migrations/20260125_01_pillar_silos.sql
-- + supabase/migrations/20260221_01_unique_pillar_per_silo.sql

-- Unique index para forçar 1 PILLAR por silo
CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_unique_pillar_per_silo
  ON public.posts (silo_id)
  WHERE silo_role = 'PILLAR';

NOTIFY pgrst, 'reload schema';
```

---

### MIGRATION 05 — Grupos Editoriais

**Cria a tabela silo_groups com constraint de unicidade (silo_id, key).**

```sql
-- M-05: silo_groups editorial groups
-- Arquivo original: supabase/migrations/20260222_01_silo_groups_config.sql

CREATE TABLE IF NOT EXISTS public.silo_groups (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  silo_id     UUID        NOT NULL REFERENCES public.silos(id) ON DELETE CASCADE,
  key         TEXT        NOT NULL,     -- ex: "decisao_escolha"
  label       TEXT        NOT NULL,     -- ex: "Decisão / escolha"
  menu_order  INT         NOT NULL DEFAULT 0,
  keywords    TEXT[]      DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (silo_id, key)
);

CREATE INDEX IF NOT EXISTS silo_groups_silo_idx ON public.silo_groups (silo_id);

NOTIFY pgrst, 'reload schema';
```

---

### MIGRATION 06 — Hierarchy Pivot (silo_posts)

**Cria a tabela silo_posts com hierarquia PILLAR/SUPPORT/AUX.**

```sql
-- M-06: silo_posts hierarchy pivot
-- Arquivo original: supabase/migrations/20260225_01_canonical_silo_map_audits.sql (parte 1)

CREATE TABLE IF NOT EXISTS public.silo_posts (
  silo_id         UUID        NOT NULL REFERENCES public.silos(id) ON DELETE CASCADE,
  post_id         UUID        NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  role            TEXT,                                           -- PILLAR | SUPPORT | AUX
  position        INTEGER     DEFAULT 0,
  level           INTEGER     NOT NULL DEFAULT 0,
  parent_post_id  UUID        REFERENCES public.posts(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (silo_id, post_id)
);

-- Adiciona constraint de role sem quebrar em caso de dado legado
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'silo_posts_role_check'
      AND conrelid = 'public.silo_posts'::REGCLASS
  ) THEN
    BEGIN
      ALTER TABLE public.silo_posts
        ADD CONSTRAINT silo_posts_role_check
        CHECK (role IN ('PILLAR', 'SUPPORT', 'AUX') OR role IS NULL);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_silo_posts_silo ON public.silo_posts (silo_id);
CREATE INDEX IF NOT EXISTS idx_silo_posts_post ON public.silo_posts (post_id);
CREATE INDEX IF NOT EXISTS idx_silo_posts_role ON public.silo_posts (role);

-- Campos de menu de grupos nos posts que ainda não existem
ALTER TABLE IF EXISTS public.posts
  ADD COLUMN IF NOT EXISTS silo_group       TEXT,
  ADD COLUMN IF NOT EXISTS silo_group_order INT     DEFAULT 0,
  ADD COLUMN IF NOT EXISTS show_in_silo_menu BOOLEAN DEFAULT TRUE;

-- Indexes úteis para renderização do hub
CREATE INDEX IF NOT EXISTS idx_posts_silo_group_order
  ON public.posts (silo_id, silo_group, silo_group_order, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_silo_menu_visibility
  ON public.posts (silo_id, show_in_silo_menu);

NOTIFY pgrst, 'reload schema';
```

---

### MIGRATION 07 — Links Granulares (post_link_occurrences)

**Tabela principal de ocorrências de links: âncora, posição, tipo, rel flags.**

```sql
-- M-07: post_link_occurrences (granular)
-- Arquivo original: supabase/migrations/20260225_01_canonical_silo_map_audits.sql (parte 2)
-- + migrations/03_silo_v2_link_details.sql
-- + migrations/04_silo_v2_link_positions.sql

CREATE TABLE IF NOT EXISTS public.post_link_occurrences (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  silo_id         UUID        NOT NULL REFERENCES public.silos(id) ON DELETE CASCADE,
  source_post_id  UUID        NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  target_post_id  UUID        REFERENCES public.posts(id) ON DELETE SET NULL,  -- nullable = links externos/afiliados
  anchor_text     TEXT        NOT NULL,
  context_snippet TEXT,                   -- ~180 chars ao redor do link
  position_bucket TEXT,                   -- START | MID | END (terços do post)
  href_normalized TEXT        NOT NULL,
  link_type       TEXT        NOT NULL DEFAULT 'INTERNAL',  -- INTERNAL | EXTERNAL | AFFILIATE
  is_nofollow     BOOLEAN     NOT NULL DEFAULT FALSE,
  is_sponsored    BOOLEAN     NOT NULL DEFAULT FALSE,
  is_ugc          BOOLEAN     NOT NULL DEFAULT FALSE,
  is_blank        BOOLEAN     NOT NULL DEFAULT FALSE,
  start_index     INTEGER,                -- posição no conteúdo (editor)
  end_index       INTEGER,
  occurrence_key  TEXT,                   -- hash SHA1 para dedup/upsert
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Constraints idempotentes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'post_link_occurrences_position_bucket_check'
      AND conrelid = 'public.post_link_occurrences'::REGCLASS
  ) THEN
    BEGIN
      ALTER TABLE public.post_link_occurrences
        ADD CONSTRAINT post_link_occurrences_position_bucket_check
        CHECK (position_bucket IN ('START', 'MID', 'END') OR position_bucket IS NULL);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'post_link_occurrences_link_type_check'
      AND conrelid = 'public.post_link_occurrences'::REGCLASS
  ) THEN
    BEGIN
      ALTER TABLE public.post_link_occurrences
        ADD CONSTRAINT post_link_occurrences_link_type_check
        CHECK (link_type IN ('INTERNAL', 'EXTERNAL', 'AFFILIATE'));
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_occurrences_silo   ON public.post_link_occurrences (silo_id);
CREATE INDEX IF NOT EXISTS idx_occurrences_source ON public.post_link_occurrences (silo_id, source_post_id);
CREATE INDEX IF NOT EXISTS idx_occurrences_target ON public.post_link_occurrences (silo_id, target_post_id);
CREATE INDEX IF NOT EXISTS idx_occurrences_pair   ON public.post_link_occurrences (source_post_id, target_post_id);
CREATE INDEX IF NOT EXISTS idx_occurrences_key    ON public.post_link_occurrences (occurrence_key);

NOTIFY pgrst, 'reload schema';
```

---

### MIGRATION 08 — Auditoria de Silos e Links

**Cria silo_audits e link_audits com campos completos de score e ação de reparo.**

```sql
-- M-08: silo_audits + link_audits
-- Arquivo original: supabase/migrations/20260225_01_canonical_silo_map_audits.sql (partes 3 e 4)
-- + migrations/05_link_audits_repair_fields.sql

CREATE TABLE IF NOT EXISTS public.silo_audits (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  silo_id      UUID        NOT NULL REFERENCES public.silos(id) ON DELETE CASCADE,
  fingerprint  TEXT        NOT NULL,   -- hash do estado (cache invalidation)
  health_score INTEGER     NOT NULL,   -- 0-100
  status       TEXT        NOT NULL,   -- OK | WARNING | CRITICAL
  summary      JSONB       NOT NULL DEFAULT '{}'::JSONB,
  issues       JSONB       NOT NULL DEFAULT '[]'::JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'silo_audits_health_score_check' AND conrelid = 'public.silo_audits'::REGCLASS) THEN
    BEGIN ALTER TABLE public.silo_audits ADD CONSTRAINT silo_audits_health_score_check CHECK (health_score >= 0 AND health_score <= 100);
    EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'silo_audits_status_check' AND conrelid = 'public.silo_audits'::REGCLASS) THEN
    BEGIN ALTER TABLE public.silo_audits ADD CONSTRAINT silo_audits_status_check CHECK (status IN ('OK', 'WARNING', 'CRITICAL'));
    EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_silo_audits_silo        ON public.silo_audits (silo_id);
CREATE INDEX IF NOT EXISTS idx_silo_audits_fingerprint ON public.silo_audits (fingerprint);
CREATE INDEX IF NOT EXISTS idx_silo_audits_created     ON public.silo_audits (created_at DESC);

-- ----

CREATE TABLE IF NOT EXISTS public.link_audits (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  silo_id         UUID        REFERENCES public.silos(id) ON DELETE CASCADE,
  occurrence_id   UUID        NOT NULL REFERENCES public.post_link_occurrences(id) ON DELETE CASCADE,
  score           INTEGER     NOT NULL,    -- 0-100
  label           TEXT        NOT NULL,    -- STRONG | OK | WEAK
  reasons         JSONB       NOT NULL DEFAULT '[]'::JSONB,
  suggested_anchor TEXT,
  note            TEXT,
  action          TEXT,                    -- KEEP | CHANGE_ANCHOR | REMOVE_LINK | etc.
  recommendation  TEXT,
  spam_risk       INTEGER,                 -- 0-100
  intent_match    INTEGER,                 -- 0-100
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'link_audits_score_check' AND conrelid = 'public.link_audits'::REGCLASS) THEN
    BEGIN ALTER TABLE public.link_audits ADD CONSTRAINT link_audits_score_check CHECK (score >= 0 AND score <= 100);
    EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'link_audits_label_check' AND conrelid = 'public.link_audits'::REGCLASS) THEN
    BEGIN ALTER TABLE public.link_audits ADD CONSTRAINT link_audits_label_check CHECK (label IN ('STRONG', 'OK', 'WEAK'));
    EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_link_audits_silo       ON public.link_audits (silo_id);
CREATE INDEX IF NOT EXISTS idx_link_audits_occurrence ON public.link_audits (occurrence_id);
CREATE INDEX IF NOT EXISTS idx_link_audits_action     ON public.link_audits (action);
CREATE INDEX IF NOT EXISTS idx_link_audits_spam_risk  ON public.link_audits (spam_risk);

NOTIFY pgrst, 'reload schema';
```

---

### MIGRATION 09 — Seed: Grupos Editoriais (genérico, sem nicho)

**Insere os 6 grupos editoriais canônicos. Execute depois de criar os silos.**

```sql
-- M-09: Insert default editorial groups for all active silos
-- Executa via upsert — seguro rodar múltiplas vezes.

INSERT INTO public.silo_groups (silo_id, key, label, menu_order, keywords)
SELECT
  s.id,
  g.key,
  g.label,
  g.menu_order,
  g.keywords
FROM public.silos s
CROSS JOIN (VALUES
  ('preco_oportunidade',  'Preço / oportunidade',  10, ARRAY['preco','barato','oferta','custo','valor']),
  ('decisao_escolha',     'Decisão / escolha',     20, ARRAY['melhor','guia','qual','comparativo','diferença']),
  ('tipos',               'Tipos',                 30, ARRAY['tipos','modelo','textura','versão','variação']),
  ('uso_como_fazer',      'Uso / como fazer',      40, ARRAY['como usar','rotina','ordem','aplicar','passo']),
  ('marcas_produtos',     'Marcas / produtos',     50, ARRAY['marca','review','resenha','produto','análise']),
  ('resultados_tempo',    'Resultados / tempo',    60, ARRAY['resultado','tempo','prazo','quando','quanto tempo'])
) AS g(key, label, menu_order, keywords)
ON CONFLICT (silo_id, key) DO NOTHING;
```

---

## CONSOLIDATED SCRIPT — Instalação Limpa (Projeto Novo)

> Execute este script único no SQL Editor de um projeto Supabase zerado.
> Inclui todos os passos acima em ordem, de forma consolidada e idempotente.

```sql
-- ============================================================
-- BLOG CMS — Fresh Install Script
-- Stack: Supabase (Postgres 17) + Next.js App Router + Tiptap
-- Seguro para executar múltiplas vezes (IF NOT EXISTS + DO blocks)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. SILOS
CREATE TABLE IF NOT EXISTS public.silos (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 TEXT        NOT NULL,
  slug                 TEXT        NOT NULL UNIQUE,
  description          TEXT,
  meta_title           TEXT,
  meta_description     TEXT,
  hero_image_url       TEXT,
  hero_image_alt       TEXT,
  pillar_content_json  JSONB,
  pillar_content_html  TEXT,
  menu_order           INT         DEFAULT 0,
  is_active            BOOLEAN     DEFAULT TRUE,
  show_in_navigation   BOOLEAN     DEFAULT TRUE,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_silos_public_navigation
  ON public.silos (is_active, show_in_navigation, menu_order);

-- 2. POSTS
CREATE TABLE IF NOT EXISTS public.posts (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  silo_id              UUID        REFERENCES public.silos(id) ON DELETE SET NULL,

  -- Identidade e URL
  title                TEXT        NOT NULL,          -- H1 = keyword principal
  slug                 TEXT        NOT NULL UNIQUE,   -- rota pública
  target_keyword       TEXT        NOT NULL,          -- keyword KGR principal

  -- Conteúdo Tiptap
  content_json         JSONB,                         -- JSON do editor
  content_html         TEXT,                          -- HTML renderizado

  -- SEO
  seo_title            TEXT,
  meta_title           TEXT,
  meta_description     TEXT,
  canonical_path       TEXT,
  supporting_keywords  TEXT[]      DEFAULT '{}',
  entities             TEXT[]      DEFAULT '{}',
  faq_json             JSONB,
  howto_json           JSONB,
  schema_type          TEXT        NOT NULL DEFAULT 'article',
  seo_score            INT         DEFAULT 0,

  -- Imagens
  cover_image          TEXT,
  hero_image_url       TEXT,
  hero_image_alt       TEXT,
  og_image_url         TEXT,
  images               JSONB       DEFAULT '[]',

  -- Hierarquia Silo
  silo_role            TEXT,                          -- PILLAR | SUPPORT | AUX
  silo_group           TEXT,                          -- chave do grupo editorial
  silo_order           INT         DEFAULT 0,
  silo_group_order     INT         DEFAULT 0,
  show_in_silo_menu    BOOLEAN     DEFAULT TRUE,

  -- Intenção
  intent               TEXT,                          -- informational | commercial | transactional
  pillar_rank          INT         DEFAULT 0,
  is_featured          BOOLEAN     DEFAULT FALSE,

  -- E-E-A-T
  author_name          TEXT,
  expert_name          TEXT,
  expert_role          TEXT,
  expert_bio           TEXT,
  expert_credentials   TEXT,
  reviewed_by          TEXT,
  reviewed_at          TIMESTAMPTZ,
  sources              JSONB       DEFAULT '[]',
  disclaimer           TEXT,

  -- Afiliados
  amazon_products      JSONB,

  -- Publicação
  status               TEXT        NOT NULL DEFAULT 'draft',
  published            BOOLEAN     DEFAULT FALSE,
  published_at         TIMESTAMPTZ,
  scheduled_at         TIMESTAMPTZ,
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS posts_silo_id_idx            ON public.posts (silo_id);
CREATE INDEX IF NOT EXISTS posts_updated_at_idx         ON public.posts (updated_at DESC);
CREATE INDEX IF NOT EXISTS posts_status_idx             ON public.posts (status);
CREATE INDEX IF NOT EXISTS posts_scheduled_at_idx       ON public.posts (scheduled_at);
CREATE INDEX IF NOT EXISTS idx_posts_silo_group_order   ON public.posts (silo_id, silo_group, silo_group_order, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_silo_menu_visibility ON public.posts (silo_id, show_in_silo_menu);

ALTER TABLE public.posts
  ADD CONSTRAINT IF NOT EXISTS posts_status_check
  CHECK (status IN ('draft', 'review', 'scheduled', 'published'));

ALTER TABLE public.posts
  ADD CONSTRAINT IF NOT EXISTS posts_schema_type_check
  CHECK (schema_type IN ('article', 'review', 'faq', 'howto'));

ALTER TABLE public.posts
  ADD CONSTRAINT IF NOT EXISTS posts_published_status_check
  CHECK (
    (status = 'published' AND published = TRUE) OR
    (status <> 'published' AND published = FALSE)
  );

-- Unique: só 1 PILLAR por silo
CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_unique_pillar_per_silo
  ON public.posts (silo_id)
  WHERE silo_role = 'PILLAR';

-- 3. SILO_GROUPS
CREATE TABLE IF NOT EXISTS public.silo_groups (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  silo_id     UUID        NOT NULL REFERENCES public.silos(id) ON DELETE CASCADE,
  key         TEXT        NOT NULL,
  label       TEXT        NOT NULL,
  menu_order  INT         NOT NULL DEFAULT 0,
  keywords    TEXT[]      DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (silo_id, key)
);

CREATE INDEX IF NOT EXISTS silo_groups_silo_idx ON public.silo_groups (silo_id);

-- 4. SILO_POSTS (hierarquia pivot)
CREATE TABLE IF NOT EXISTS public.silo_posts (
  silo_id         UUID NOT NULL REFERENCES public.silos(id) ON DELETE CASCADE,
  post_id         UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  role            TEXT,
  position        INTEGER DEFAULT 0,
  level           INTEGER NOT NULL DEFAULT 0,
  parent_post_id  UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (silo_id, post_id)
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'silo_posts_role_check' AND conrelid = 'public.silo_posts'::REGCLASS) THEN
    BEGIN
      ALTER TABLE public.silo_posts ADD CONSTRAINT silo_posts_role_check CHECK (role IN ('PILLAR', 'SUPPORT', 'AUX') OR role IS NULL);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_silo_posts_silo ON public.silo_posts (silo_id);
CREATE INDEX IF NOT EXISTS idx_silo_posts_post ON public.silo_posts (post_id);
CREATE INDEX IF NOT EXISTS idx_silo_posts_role ON public.silo_posts (role);

-- 5. POST_LINKS (índice de links)
CREATE TABLE IF NOT EXISTS public.post_links (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_post_id  UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  target_post_id  UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  target_url      TEXT,
  anchor_text     TEXT,
  link_type       TEXT NOT NULL,
  rel_flags       TEXT[] DEFAULT '{}',
  is_blank        BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS post_links_source_idx ON public.post_links (source_post_id);
CREATE INDEX IF NOT EXISTS post_links_target_idx ON public.post_links (target_post_id);

-- 6. POST_LINK_OCCURRENCES (granular)
CREATE TABLE IF NOT EXISTS public.post_link_occurrences (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  silo_id         UUID NOT NULL REFERENCES public.silos(id) ON DELETE CASCADE,
  source_post_id  UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  target_post_id  UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  anchor_text     TEXT NOT NULL,
  context_snippet TEXT,
  position_bucket TEXT,
  href_normalized TEXT NOT NULL,
  link_type       TEXT NOT NULL DEFAULT 'INTERNAL',
  is_nofollow     BOOLEAN NOT NULL DEFAULT FALSE,
  is_sponsored    BOOLEAN NOT NULL DEFAULT FALSE,
  is_ugc          BOOLEAN NOT NULL DEFAULT FALSE,
  is_blank        BOOLEAN NOT NULL DEFAULT FALSE,
  start_index     INTEGER,
  end_index       INTEGER,
  occurrence_key  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'post_link_occurrences_position_bucket_check' AND conrelid = 'public.post_link_occurrences'::REGCLASS) THEN
    BEGIN ALTER TABLE public.post_link_occurrences ADD CONSTRAINT post_link_occurrences_position_bucket_check CHECK (position_bucket IN ('START', 'MID', 'END') OR position_bucket IS NULL);
    EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'post_link_occurrences_link_type_check' AND conrelid = 'public.post_link_occurrences'::REGCLASS) THEN
    BEGIN ALTER TABLE public.post_link_occurrences ADD CONSTRAINT post_link_occurrences_link_type_check CHECK (link_type IN ('INTERNAL', 'EXTERNAL', 'AFFILIATE'));
    EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_occurrences_silo   ON public.post_link_occurrences (silo_id);
CREATE INDEX IF NOT EXISTS idx_occurrences_source ON public.post_link_occurrences (silo_id, source_post_id);
CREATE INDEX IF NOT EXISTS idx_occurrences_target ON public.post_link_occurrences (silo_id, target_post_id);
CREATE INDEX IF NOT EXISTS idx_occurrences_pair   ON public.post_link_occurrences (source_post_id, target_post_id);
CREATE INDEX IF NOT EXISTS idx_occurrences_key    ON public.post_link_occurrences (occurrence_key);

-- 7. SILO_AUDITS
CREATE TABLE IF NOT EXISTS public.silo_audits (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  silo_id      UUID NOT NULL REFERENCES public.silos(id) ON DELETE CASCADE,
  fingerprint  TEXT NOT NULL,
  health_score INTEGER NOT NULL,
  status       TEXT NOT NULL,
  summary      JSONB NOT NULL DEFAULT '{}',
  issues       JSONB NOT NULL DEFAULT '[]',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'silo_audits_health_score_check' AND conrelid = 'public.silo_audits'::REGCLASS) THEN
    BEGIN ALTER TABLE public.silo_audits ADD CONSTRAINT silo_audits_health_score_check CHECK (health_score >= 0 AND health_score <= 100); EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'silo_audits_status_check' AND conrelid = 'public.silo_audits'::REGCLASS) THEN
    BEGIN ALTER TABLE public.silo_audits ADD CONSTRAINT silo_audits_status_check CHECK (status IN ('OK', 'WARNING', 'CRITICAL')); EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_silo_audits_silo        ON public.silo_audits (silo_id);
CREATE INDEX IF NOT EXISTS idx_silo_audits_fingerprint ON public.silo_audits (fingerprint);
CREATE INDEX IF NOT EXISTS idx_silo_audits_created     ON public.silo_audits (created_at DESC);

-- 8. LINK_AUDITS
CREATE TABLE IF NOT EXISTS public.link_audits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  silo_id         UUID REFERENCES public.silos(id) ON DELETE CASCADE,
  occurrence_id   UUID NOT NULL REFERENCES public.post_link_occurrences(id) ON DELETE CASCADE,
  score           INTEGER NOT NULL,
  label           TEXT NOT NULL,
  reasons         JSONB NOT NULL DEFAULT '[]',
  suggested_anchor TEXT,
  note            TEXT,
  action          TEXT,
  recommendation  TEXT,
  spam_risk       INTEGER,
  intent_match    INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'link_audits_score_check' AND conrelid = 'public.link_audits'::REGCLASS) THEN
    BEGIN ALTER TABLE public.link_audits ADD CONSTRAINT link_audits_score_check CHECK (score >= 0 AND score <= 100); EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'link_audits_label_check' AND conrelid = 'public.link_audits'::REGCLASS) THEN
    BEGIN ALTER TABLE public.link_audits ADD CONSTRAINT link_audits_label_check CHECK (label IN ('STRONG', 'OK', 'WEAK')); EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_link_audits_silo       ON public.link_audits (silo_id);
CREATE INDEX IF NOT EXISTS idx_link_audits_occurrence ON public.link_audits (occurrence_id);
CREATE INDEX IF NOT EXISTS idx_link_audits_action     ON public.link_audits (action);
CREATE INDEX IF NOT EXISTS idx_link_audits_spam_risk  ON public.link_audits (spam_risk);

-- 9. SEED: Grupos editoriais default (para todos os silos ativos)
INSERT INTO public.silo_groups (silo_id, key, label, menu_order, keywords)
SELECT
  s.id,
  g.key,
  g.label,
  g.menu_order,
  g.keywords
FROM public.silos s
CROSS JOIN (VALUES
  ('preco_oportunidade',  'Preço / oportunidade',  10, ARRAY['preco','barato','oferta','custo','valor']),
  ('decisao_escolha',     'Decisão / escolha',     20, ARRAY['melhor','guia','qual','comparativo','diferença']),
  ('tipos',               'Tipos',                 30, ARRAY['tipos','modelo','textura','versão','variação']),
  ('uso_como_fazer',      'Uso / como fazer',      40, ARRAY['como usar','rotina','ordem','aplicar','passo']),
  ('marcas_produtos',     'Marcas / produtos',     50, ARRAY['marca','review','resenha','produto','análise']),
  ('resultados_tempo',    'Resultados / tempo',    60, ARRAY['resultado','tempo','prazo','quando','quanto tempo'])
) AS g(key, label, menu_order, keywords)
ON CONFLICT (silo_id, key) DO NOTHING;

-- Final reload
NOTIFY pgrst, 'reload schema';
```

---

## Regras de Negócio Críticas (Invariantes do Schema)

| # | Regra | Enforcement |
|---|-------|-------------|
| 1 | Só 1 `PILLAR` por silo | `UNIQUE INDEX` parcial em `posts(silo_id) WHERE silo_role = 'PILLAR'` |
| 2 | `AUX` nunca aparece no menu do hub | `show_in_silo_menu = FALSE` — enforced no editor |
| 3 | `AUX` e `PILLAR` nunca têm `silo_group` | lógica de aplicação (Server Action) |
| 4 | `status = published` → `published = TRUE` | CHECK constraint `posts_published_status_check` |
| 5 | `schema_type` válido | CHECK constraint `posts_schema_type_check` |
| 6 | `status` válido | CHECK constraint `posts_status_check` |
| 7 | Grupos criados automaticamente ao criar silo | lógica de aplicação (Server Action de silos) |
| 8 | Canonical path = `/{silo_slug}/{post_slug}` | lógica de aplicação (`lib/seo/canonical.ts`) |
| 9 | `occurrence_key` = SHA1 da ocorrência | lógica de aplicação (siloService) |

---

## Checklist de Verificação Pós-Deploy

Execute no SQL Editor para confirmar que tudo foi criado:

```sql
SELECT table_name, (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') AS col_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('silos','posts','silo_groups','silo_posts','post_links','post_link_occurrences','silo_audits','link_audits')
ORDER BY table_name;
```

Resultado esperado: **8 tabelas** com a contagem de colunas de cada uma.

---

## Referências de Arquivos no Repositório

| Arquivo | Conteúdo |
|---------|----------|
| `supabase/schema.sql` | Schema inicial (silos + posts + post_links + batches) |
| `supabase/migrations/20260121_*.sql` | Bootstrap mínimo |
| `supabase/migrations/20260122_*.sql` | Campos do editor |
| `supabase/migrations/20260219_*.sql` | Grupos editoriais nos posts |
| `supabase/migrations/20260221_*.sql` | Unique PILLAR |
| `supabase/migrations/20260222_*.sql` | Tabela silo_groups |
| `supabase/migrations/20260225_*.sql` | **Migration canônica consolidada** (silo_posts + occurrences + audits) |
| `migrations/00_complete_silo_map_setup.sql` | Setup do Silo Map (v1) |
| `migrations/03_silo_v2_link_details.sql` | rel flags nos links |
| `migrations/04_silo_v2_link_positions.sql` | start/end_index + occurrence_key |
| `migrations/05_link_audits_repair_fields.sql` | action + spam_risk nos link_audits |
| `supabase/seed.json` | Exemplo de seed de silos (genérico) |
