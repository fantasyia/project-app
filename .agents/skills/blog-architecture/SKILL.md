---
name: Blog Architecture Preset
description: >
  Radiografia completa da arquitetura do blog Multi-Silo (CMS interno, Tiptap, Supabase, Next.js App Router).
  Use este preset como arquitetura canônica do blog/editorial público do FantasyIA ou para replicar o mesmo sistema em novos projetos com dados e conteúdos de exemplo.
  Contém: schema SQL, tipos TypeScript, estrutura de rotas, painel de editor, painéis de auditoria SEO/silo.
---

# Blog Architecture Preset — Sistema Multi-Silo

> Este documento é um **preset completo** e autocontido do blog CMS Multi-Silo.
> Ele cobre: banco de dados, tipos, rotas Next.js, painel de administração, editor (Tiptap), painéis SEO e auditoria de silos.
> No FantasyIA, usar este preset apenas para o **blog/editorial público** e o **backend do Redator de Blog**.
> Não usar esta modelagem para o domínio principal de subscriber/chat/assinatura/PPV.
> Ao replicar para novos projetos, substitua os dados de exemplo (silos, grupos, keywords) pelo nicho destino.

---

## 1. Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────┐
│                   Next.js App Router                │
│                                                     │
│  app/                                               │
│  ├── [silo]/[slug]         → Post público           │
│  ├── [silo]/               → Hub do Silo (pilar)   │
│  ├── admin/                → Painel editorial       │
│  │   ├── editor/[postId]   → Editor Tiptap          │
│  │   ├── silos/[slug]      → Gerenciar Silos        │
│  │   └── page.tsx          → Dashboard de posts     │
│  └── api/admin/…           → API Routes internas    │
│                                                     │
│  lib/                                               │
│  ├── db.ts                 → Queries Supabase        │
│  ├── silo-config.ts        → Config estática Silos  │
│  ├── silo/groups.ts        → Grupos editoriais       │
│  ├── silo/siloService.ts   → Sync links ocorrências │
│  ├── seo/                  → SEO utils + canonical  │
│  └── editor/               → Tiptap doc renderer    │
│                                                     │
│  components/               │
│  ├── editor/               → Componentes Tiptap      │
│  └── silo/                 → Silo Map (ReactFlow)   │
│                                                     │
│  Supabase (Postgres)                                │
│  ├── silos                 → Categorias-mãe         │
│  ├── posts                 → Artigos / posts        │
│  ├── silo_posts            → Hierarquia pivô        │
│  ├── silo_groups           → Grupos editoriais      │
│  ├── post_links            → Índice de links        │
│  ├── post_link_occurrences → Ocorrências granulares │
│  ├── silo_audits           → Auditoria de silos     │
│  └── link_audits           → Auditoria de links     │
└─────────────────────────────────────────────────────┘
```

**Stack principal:**
- Next.js 16 (App Router, RSC)
- Supabase (Postgres + Auth + SSR)
- Tiptap 3 (editor rich text)
- ReactFlow (Silo Map visual)
- Zod (validação de schemas)
- Tailwind CSS 4
- Cheerio (parse HTML server-side)

---

## 2. Schema SQL Completo

Rode todos os blocos **em ordem** no Supabase SQL Editor.

### 2.1 Extensões

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### 2.2 Tabela `silos`

```sql
CREATE TABLE IF NOT EXISTS public.silos (
  id              UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  name            TEXT          NOT NULL,
  slug            TEXT          NOT NULL UNIQUE,
  description     TEXT,
  meta_title      TEXT,
  meta_description TEXT,
  hero_image_url  TEXT,
  hero_image_alt  TEXT,
  pillar_content_json JSONB,
  pillar_content_html TEXT,
  menu_order      INT           DEFAULT 0,
  is_active       BOOLEAN       DEFAULT TRUE,
  show_in_navigation BOOLEAN    DEFAULT TRUE,
  created_at      TIMESTAMPTZ   DEFAULT NOW()
);
```

**Exemplo de registro:**
```json
{
  "name": "Anti-idade e Retinol",
  "slug": "anti-idade-e-retinol",
  "description": "Hub para comparar critérios de escolha de creme para rugas.",
  "meta_title": "Guia Anti-idade e Retinol | [FantasyIA]",
  "meta_description": "Saiba qual é o melhor creme para rugas.",
  "menu_order": 3,
  "is_active": true
}
```

### 2.3 Tabela `posts`

```sql
CREATE TABLE IF NOT EXISTS public.posts (
  id                   UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  silo_id              UUID         REFERENCES public.silos(id) ON DELETE SET NULL,

  -- Identidade e URL
  title                TEXT         NOT NULL,          -- H1 = keyword principal
  slug                 TEXT         NOT NULL UNIQUE,   -- URL slugificada
  target_keyword       TEXT         NOT NULL,          -- keyword KGR principal

  -- Conteúdo Tiptap
  content_json         JSONB,                          -- JSON do Tiptap (edição)
  content_html         TEXT,                           -- HTML renderizado (publicação)

  -- SEO
  seo_title            TEXT,
  meta_title           TEXT,
  meta_description     TEXT,
  canonical_path       TEXT,
  supporting_keywords  TEXT[]        DEFAULT '{}',
  entities             TEXT[]        DEFAULT '{}',
  faq_json             JSONB,
  howto_json           JSONB,
  schema_type          TEXT          NOT NULL DEFAULT 'article',
  seo_score            INT           DEFAULT 0,

  -- Imagens
  cover_image          TEXT,
  hero_image_url        TEXT,
  hero_image_alt        TEXT,
  og_image_url          TEXT,
  images               JSONB         DEFAULT '[]',

  -- Hierarquia Silo
  silo_role            TEXT,                           -- PILLAR | SUPPORT | AUX
  silo_group           TEXT,                           -- chave do grupo editorial
  silo_order           INT           DEFAULT 0,
  silo_group_order     INT           DEFAULT 0,
  show_in_silo_menu    BOOLEAN       DEFAULT TRUE,

  -- Meta de intenção / destaque
  intent               TEXT,                           -- informational | commercial | transactional
  pillar_rank          INT           DEFAULT 0,
  is_featured          BOOLEAN       DEFAULT FALSE,

  -- E-E-A-T
  author_name          TEXT,
  expert_name          TEXT,
  expert_role          TEXT,
  expert_bio           TEXT,
  expert_credentials   TEXT,
  reviewed_by          TEXT,
  reviewed_at          TIMESTAMPTZ,
  sources              JSONB         DEFAULT '[]',
  disclaimer           TEXT,

  -- Afiliados
  amazon_products      JSONB,

  -- Publicação
  status               TEXT          NOT NULL DEFAULT 'draft',
  published            BOOLEAN       DEFAULT FALSE,
  published_at         TIMESTAMPTZ,
  scheduled_at         TIMESTAMPTZ,
  updated_at           TIMESTAMPTZ   DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS posts_silo_id_idx    ON public.posts (silo_id);
CREATE INDEX IF NOT EXISTS posts_updated_at_idx ON public.posts (updated_at DESC);
CREATE INDEX IF NOT EXISTS posts_status_idx     ON public.posts (status);
CREATE INDEX IF NOT EXISTS posts_scheduled_at_idx ON public.posts (scheduled_at);

-- Constraints
ALTER TABLE public.posts
  ADD CONSTRAINT IF NOT EXISTS posts_status_check
  CHECK (status IN ('draft', 'review', 'scheduled', 'published'));

ALTER TABLE public.posts
  ADD CONSTRAINT IF NOT EXISTS posts_schema_type_check
  CHECK (schema_type IN ('article', 'review', 'faq', 'howto'));

ALTER TABLE public.posts
  ADD CONSTRAINT IF NOT EXISTS posts_published_status_check
  CHECK ((status = 'published' AND published = TRUE) OR
         (status <> 'published' AND published = FALSE));

-- Unicidade: só um PILLAR por silo
CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_unique_pillar_per_silo
  ON public.posts (silo_id)
  WHERE silo_role = 'PILLAR';
```

**Exemplo de registro:**
```json
{
  "title": "melhor retinol para pele oleosa",
  "slug": "melhor-retinol-para-pele-oleosa",
  "target_keyword": "melhor retinol para pele oleosa",
  "silo_role": "SUPPORT",
  "silo_group": "decisao_escolha",
  "silo_order": 1,
  "status": "draft",
  "schema_type": "article",
  "intent": "commercial"
}
```

### 2.4 Tabela `silo_groups`

```sql
CREATE TABLE IF NOT EXISTS public.silo_groups (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  silo_id     UUID        NOT NULL REFERENCES public.silos(id) ON DELETE CASCADE,
  key         TEXT        NOT NULL,           -- ex: "decisao_escolha"
  label       TEXT        NOT NULL,           -- ex: "Decisão / escolha"
  menu_order  INT         NOT NULL DEFAULT 0,
  keywords    TEXT[]      DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (silo_id, key)
);

CREATE INDEX IF NOT EXISTS silo_groups_silo_idx ON public.silo_groups (silo_id);
```

### 2.5 Tabela `silo_posts` (hierarquia pivô)

```sql
CREATE TABLE IF NOT EXISTS public.silo_posts (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  silo_id         UUID        NOT NULL REFERENCES public.silos(id) ON DELETE CASCADE,
  post_id         UUID        NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  role            TEXT        CHECK (role IN ('PILLAR', 'SUPPORT', 'AUX')),
  position        INTEGER,
  level           INTEGER     DEFAULT 0,
  parent_post_id  UUID        REFERENCES public.posts(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (silo_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_silo_posts_silo ON public.silo_posts (silo_id);
CREATE INDEX IF NOT EXISTS idx_silo_posts_post ON public.silo_posts (post_id);
CREATE INDEX IF NOT EXISTS idx_silo_posts_role ON public.silo_posts (role);
```

### 2.6 Tabela `post_links`

```sql
CREATE TABLE IF NOT EXISTS public.post_links (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  source_post_id  UUID        REFERENCES public.posts(id) ON DELETE CASCADE,
  target_post_id  UUID        REFERENCES public.posts(id) ON DELETE SET NULL,
  target_url      TEXT,
  anchor_text     TEXT,
  link_type       TEXT        NOT NULL,
  rel_flags       TEXT[]      DEFAULT '{}',
  is_blank        BOOLEAN     DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS post_links_source_idx ON public.post_links (source_post_id);
CREATE INDEX IF NOT EXISTS post_links_target_idx ON public.post_links (target_post_id);
```

### 2.7 Tabela `post_link_occurrences`

```sql
CREATE TABLE IF NOT EXISTS public.post_link_occurrences (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  silo_id          UUID        NOT NULL REFERENCES public.silos(id) ON DELETE CASCADE,
  source_post_id   UUID        NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  target_post_id   UUID        REFERENCES public.posts(id) ON DELETE CASCADE,
  anchor_text      TEXT        NOT NULL,
  context_snippet  TEXT,
  occurrence_key   TEXT,
  position_bucket  TEXT        CHECK (position_bucket IN ('START', 'MID', 'END')),
  href_normalized  TEXT        NOT NULL,
  link_type        TEXT        CHECK (link_type IN ('INTERNAL', 'EXTERNAL', 'AFFILIATE')),
  is_nofollow      BOOLEAN     DEFAULT FALSE,
  is_sponsored     BOOLEAN     DEFAULT FALSE,
  is_ugc           BOOLEAN     DEFAULT FALSE,
  is_blank         BOOLEAN     DEFAULT FALSE,
  start_index      INT,
  end_index        INT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_occurrences_silo   ON public.post_link_occurrences (silo_id);
CREATE INDEX IF NOT EXISTS idx_occurrences_source ON public.post_link_occurrences (silo_id, source_post_id);
CREATE INDEX IF NOT EXISTS idx_occurrences_target ON public.post_link_occurrences (silo_id, target_post_id);
CREATE INDEX IF NOT EXISTS idx_occurrences_pair   ON public.post_link_occurrences (source_post_id, target_post_id);
```

### 2.8 Tabelas de Auditoria

```sql
CREATE TABLE IF NOT EXISTS public.silo_audits (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  silo_id       UUID        NOT NULL REFERENCES public.silos(id) ON DELETE CASCADE,
  fingerprint   TEXT        NOT NULL,
  health_score  INTEGER     NOT NULL CHECK (health_score >= 0 AND health_score <= 100),
  status        TEXT        NOT NULL CHECK (status IN ('OK', 'WARNING', 'CRITICAL')),
  summary       JSONB       NOT NULL DEFAULT '{}',
  issues        JSONB       NOT NULL DEFAULT '[]',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.link_audits (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  silo_audit_id   UUID        NOT NULL REFERENCES public.silo_audits(id) ON DELETE CASCADE,
  occurrence_id   UUID        NOT NULL REFERENCES public.post_link_occurrences(id) ON DELETE CASCADE,
  score           INTEGER     NOT NULL CHECK (score >= 0 AND score <= 100),
  label           TEXT        NOT NULL CHECK (label IN ('STRONG', 'OK', 'WEAK')),
  reasons         JSONB       NOT NULL DEFAULT '[]',
  suggested_anchor TEXT,
  note            TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_silo_audits_silo        ON public.silo_audits (silo_id);
CREATE INDEX IF NOT EXISTS idx_silo_audits_fingerprint ON public.silo_audits (fingerprint);
CREATE INDEX IF NOT EXISTS idx_link_audits_silo_audit  ON public.link_audits (silo_audit_id);
CREATE INDEX IF NOT EXISTS idx_link_audits_occurrence  ON public.link_audits (occurrence_id);
```

---

## 3. Tipos TypeScript

### `lib/types.ts`

```typescript
export type Silo = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  hero_image_url?: string | null;
  hero_image_alt?: string | null;
  pillar_content_json?: any | null;
  pillar_content_html?: string | null;
  menu_order?: number | null;
  is_active?: boolean | null;
  show_in_navigation?: boolean | null;
  created_at: string;
};

export type Post = {
  id: string;
  silo_id: string | null;
  title: string;
  seo_title?: string | null;
  meta_title?: string | null;
  slug: string;
  target_keyword: string;
  content_json: any | null;
  content_html: string | null;
  seo_score: number | null;
  supporting_keywords: string[] | null;
  meta_description: string | null;
  canonical_path?: string | null;
  entities?: string[] | null;
  faq_json?: any | null;
  howto_json?: any | null;
  schema_type?: "article" | "review" | "faq" | "howto" | null;
  cover_image?: string | null;
  hero_image_url?: string | null;
  hero_image_alt?: string | null;
  og_image_url?: string | null;
  images?: any[] | null;
  intent?: "commercial" | "transactional" | "informational" | null | string;
  pillar_rank?: number | null;
  silo_role?: "PILLAR" | "SUPPORT" | "AUX" | null;
  silo_group?: string | null;
  silo_order?: number | null;
  silo_group_order?: number | null;
  show_in_silo_menu?: boolean | null;
  is_featured?: boolean | null;
  author_name?: string | null;
  expert_name?: string | null;
  expert_role?: string | null;
  expert_bio?: string | null;
  expert_credentials?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  sources?: any[] | null;
  disclaimer?: string | null;
  scheduled_at?: string | null;
  published_at?: string | null;
  status?: "draft" | "review" | "scheduled" | "published" | null;
  amazon_products: any | null;
  published: boolean | null;
  updated_at: string;
};

export type SiloGroup = {
  id: string;
  silo_id: string;
  key: string;
  label: string;
  menu_order: number;
  keywords?: string[] | null;
  created_at: string;
  updated_at: string;
};

export type PostWithSilo = Post & {
  silo: Pick<Silo, "slug" | "name"> | null;
};

export type SiloBatch = {
  id: string;
  silo_id: string;
  name: string;
  status: "draft" | "review" | "scheduled" | "published";
  created_at: string;
};

export type PostLink = {
  id: string;
  source_post_id: string;
  target_post_id: string | null;
  target_url: string | null;
  anchor_text: string | null;
  link_type: "internal" | "external" | "affiliate" | "about" | "mention";
  rel_flags: string[] | null;
  is_blank: boolean;
  created_at: string;
};
```

### `lib/silo/types.ts`

```typescript
export type SiloPost = {
  id: string;
  silo_id: string;
  post_id: string;
  role: "PILLAR" | "SUPPORT" | "AUX" | null;
  position: number | null;
  level: number | null;
  parent_post_id: string | null;
  created_at: string;
  updated_at: string;
};

export type LinkOccurrence = {
  id?: string;
  silo_id: string;
  source_post_id: string;
  target_post_id: string | null;
  anchor_text: string;
  context_snippet?: string | null;
  href_normalized: string;
  position_bucket?: "START" | "MID" | "END" | null;
  link_type?: "INTERNAL" | "EXTERNAL" | "AFFILIATE" | null;
};

export type SiloAudit = {
  id: string;
  health_score: number;
  status: "OK" | "WARNING" | "CRITICAL";
  issues: SiloIssue[];
  summary: any;
  created_at: string;
};

export type SiloIssue = {
  severity: "critical" | "high" | "medium" | "low" | "warning" | "info";
  message: string;
  action?: string;
  targetPostId?: string;
};

export type LinkAudit = {
  id?: string;
  occurrence_id: string;
  score: number;
  label: "STRONG" | "OK" | "WEAK";
  reasons: string[];
  suggested_anchor?: string | null;
  action?: "KEEP" | "CHANGE_ANCHOR" | "REMOVE_LINK" | "CHANGE_TARGET" | "ADD_INTERNAL_LINK" | null;
};
```

---

## 4. Configuração de Silos (`lib/silo-config.ts`)

Arquivo **estático** que define os silos no código. Serve como mapa canônico de rotas e aliases.

```typescript
export type SiloIntent = "Informacional" | "Investigacao";
export type SiloContentType = "Artigo Informativo";

export type SiloConfig = {
  slug: string;         // slug canônico (rota principal no App Router)
  title: string;        // nome exibido
  description: string;
  targetKeyword: string;
  intent: SiloIntent;
  contentType: SiloContentType;
  legacySlugs: string[]; // slugs antigos → redirecionam para slug canônico
};

export const SILOS: SiloConfig[] = [
  {
    slug: "categoria-principal",
    title: "Título do Silo",
    description: "Descrição do hub.",
    targetKeyword: "keyword pilar do silo",
    intent: "Informacional",
    contentType: "Artigo Informativo",
    legacySlugs: ["slug-antigo-1"],
  },
  // … adicionar um item por silo
];

// Grupos editoriais — IGUAIS em todos os silos
export const EDITORIAL_GROUPS = [
  "Preco / oportunidade",
  "Decisao / escolha",
  "Tipos",
  "Uso / como fazer",
  "Marcas / produtos",
  "Resultados / tempo",
] as const;
```

---

## 5. Grupos Editoriais (`lib/silo/groups.ts`)

Os 6 grupos padrão são criados automaticamente para cada silo novo.

```typescript
export type SiloGroupDefinition = {
  key: SiloGroupKey;
  label: string;
  keywords: string[];   // usadas pelos painéis de termos
  menu_order?: number;
};

const DEFAULT_SILO_GROUP_DEFINITIONS: readonly SiloGroupDefinition[] = [
  { key: "preco_oportunidade",  label: "Preço / oportunidade",  keywords: ["preco","barato","oferta","custo"], menu_order: 10 },
  { key: "decisao_escolha",     label: "Decisão / escolha",     keywords: ["melhor","guia","qual","comparativo"], menu_order: 20 },
  { key: "tipos",               label: "Tipos",                  keywords: ["tipos","modelo","textura"], menu_order: 30 },
  { key: "uso_como_fazer",      label: "Uso / como fazer",       keywords: ["como usar","rotina","ordem"], menu_order: 40 },
  { key: "marcas_produtos",     label: "Marcas / produtos",      keywords: ["marca","review","resenha"], menu_order: 50 },
  { key: "resultados_tempo",    label: "Resultados / tempo",     keywords: ["resultado","tempo","prazo"], menu_order: 60 },
];
```

**Regras de negócio:**
- Somente posts `SUPPORT` recebem grupo editorial.
- Posts `PILLAR` e `AUX` têm `silo_group = null` automaticamente.
- Ao criar um silo, os 6 grupos são inseridos via upsert em `silo_groups`.

---

## 6. Estrutura de Rotas (Next.js App Router)

```
app/
├── layout.tsx                        → Layout global (font, meta, analytics)
├── page.tsx                          → HomePage (últimos posts, silos em destaque)
├── robots.ts                         → Robots.txt dinâmico
├── sitemap.ts                        → Sitemap XML dinâmico
│
├── [silo]/                           → Rota dinâmica do silo
│   ├── page.tsx                      → Hub/Pilar do silo
│   └── [slug]/
│       └── page.tsx                  → Artigo público
│
├── admin/
│   ├── layout.tsx                    → Layout admin (autenticação)
│   ├── page.tsx                      → Dashboard: lista de posts
│   ├── actions.ts                    → Server Actions: publish, schedule, delete
│   ├── login/page.tsx                → Login admin
│   ├── new/page.tsx                  → Criar novo post
│   ├── editor/
│   │   ├── actions.ts                → Server Actions do editor (save, publish)
│   │   ├── new/page.tsx              → Criar post via wizard
│   │   └── [postId]/page.tsx         → Editor Tiptap (edição de post existente)
│   └── silos/
│       ├── page.tsx                  → Lista de silos
│       ├── actions.ts                → CRUD de silos
│       ├── new/page.tsx              → Criar silo
│       └── [slug]/page.tsx           → Editar silo + Silo Map
│
└── api/
    └── admin/
        └── silos/
            └── [siloId]/audit/route.ts  → Endpoint de auditoria
```

---

## 7. Painel de Editor (Tiptap)

O editor é dividido em três zonas principais:

```
┌─────────────────────────────────────────────────┐
│  EditorHeader  (título H1, keyword, status)     │
├────────────┬────────────────────────────────────┤
│            │  FixedToolbar (bold/italic/link…)  │
│  Editor    ├────────────────────────────────────┤
│  Sidebar   │  EditorCanvas (Tiptap editor)      │
│  (painéis) │                                    │
│            ├────────────────────────────────────┤
│            │  EditorInspector (metadata, silo)  │
└────────────┴────────────────────────────────────┘
```

### 7.1 Componentes do Editor

| Arquivo | Função |
|---------|--------|
| `AdvancedEditor.tsx` | Orquestrador principal; inicializa Tiptap + painéis |
| `EditorCanvas.tsx` | Área de digitação Tiptap; renderiza conteúdo |
| `FixedToolbar.tsx` | Barra de ferramentas fixa (formatação, inserção de blocos) |
| `EditorHeader.tsx` | Título, keyword principal, botão salvar/publicar |
| `EditorSidebar.tsx` | Container lateral dos painéis SEO/auditoria |
| `EditorInspector.tsx` | Painel direito: SEO, silo, E-E-A-T, schema type |
| `EditorToolbar.tsx` | Toolbar responsiva (mobile) |
| `EditorContext.tsx` | Context React com estado global do editor |

### 7.2 Painéis de Auditoria (Sidebar)

| Componente | Função |
|------------|--------|
| `QualityPanel.tsx` | Pontuação de qualidade editorial (legibilidade, profundidade) |
| `ReviewPanel.tsx` | Checklist de revisão (E-E-A-T, fontes, disclaimer) |
| `GuardianPanel.tsx` | YMYL guardian: alerta para claims de saúde/dinheiro |
| `PlagiarismInspectorPanel.tsx` | Detecção local de plágio (duplication fuzzy) |
| `EntitiesPanel.tsx` | Extrai e exibe entidades do conteúdo |
| `SeoPreviewDeck.tsx` | Preview de SERP (title, description, URL) |
| `SeoSidebar.tsx` | Sidebar SEO resumida |
| `SerpPanel.tsx` | Análise SERP real (requer API externa) |
| `TermsPanel.tsx` | Análise ao vivo de keywords do silo no texto |
| `LinkHygienePanel.tsx` | Auditoria completa de links (quebrados, orphans, spam) |
| `InternalLinksPanel.tsx` | Visualização de links internos e sugestões |
| `TextSearchPanel.tsx` | Busca textual dentro do conteúdo |

### 7.3 Extensões Tiptap Customizadas

| Extensão | Arquivo | Função |
|----------|---------|--------|
| `AffiliateCta` | `AffiliateCta.tsx` | Bloco CTA com link de afiliado |
| `AffiliateProductCard` | `AffiliateProductCard.tsx` | Card de produto Amazon |
| `FaqBlock` | `FaqBlock.tsx` | Bloco FAQ com schema.org |
| `CtaButton` | `CtaButton.tsx` | Botão CTA responsivo com overrides mobile/tablet |
| `EditorImage` | `EditorImage.tsx` | Imagem com controles de alinhamento/responsivo |
| `CarouselBlock` | `CarouselBlock.tsx` | Bloco carrossel de imagens |
| `IconBlock` | `IconBlock.tsx` | Bloco de ícone + texto |
| `YoutubeEmbed` | `YoutubeEmbed.tsx` | Embed de vídeo YouTube |
| `LockedTable` | `LockedTable.ts` | Tabela com colunas e render responsivo |
| `InternalLinkMention` | `InternalLinkMention.ts` | Mention node para link interno (@post) |
| `InternalLinkCandidate` | `InternalLinkCandidate.ts` | Sugestão de link candidato |
| `EntityLink` | `EntityLink.ts` | Marca de entidade SEO no texto |
| `FindInContent` | `FindInContent.ts` | Busca+highlight dentro do editor |

### 7.4 Dialogs do Editor

| Componente | Função |
|------------|--------|
| `LinkDialog.tsx` | Inserir/editar link com opções rel/target |
| `AdvancedLinkDialog.tsx` | Link avançado (rel flags, tracking, nota) |
| `ArticleFindDialog.tsx` | Buscar post interno para linkar |
| `ProductDialog.tsx` | Inserir produto Amazon (ASIN, título, preço, CTA) |
| `CtaButtonDialog.tsx` | Configurar CTA button responsivo |

---

## 8. Painel de Silos (Silo Map)

O Silo Map é uma visualização interativa com ReactFlow que mostra a hierarquia de posts dentro do silo.

```
components/silo/
├── SiloHub.tsx           → Container do hub do silo
├── SiloMapPage.tsx       → Página principal do Silo Map
├── SiloMapCanvas.tsx     → Canvas ReactFlow com nós
├── SiloMapSidebar.tsx    → Sidebar: detalhes do nó selecionado
├── SiloMapToolbar.tsx    → Toolbar do mapa
├── nodes/                → Componentes de nós do ReactFlow
└── tabs/                 → Abas do painel (mapa, grupos, auditoria)
```

**Nodes disponíveis:**
- `PillarNode` → Hub principal (1 por silo)
- `SupportNode` → Artigos de suporte (aparecem no menu do hub)
- `AuxNode` → Artigos de apoio (não aparecem no hub)

---

## 9. Serviço de Sincronização de Links (`lib/silo/siloService.ts`)

Executado automaticamente ao salvar um post no editor.

**Fluxo:**
1. Recebe `siloId`, `sourcePostId`, `htmlContent`
2. Carrega posts do silo para montar mapa de slugs e canonical paths
3. Parseia todos os `<a>` do HTML com Cheerio
4. Classifica cada link: `INTERNAL` | `EXTERNAL` | `AFFILIATE` (Amazon)
5. Para cada link: calcula `position_bucket` (START/MID/END), `occurrence_key` (hash SHA1)
6. Faz upsert em `post_link_occurrences`, preservando IDs existentes
7. Deleta ocorrências que não existem mais no conteúdo

**Critério de classificação de links:**
- Link relativo ou mesmo host → `INTERNAL`
- Domínio Amazon (`amazon.`, `amzn.to`, `a.co`) → `AFFILIATE`
- Tudo mais → `EXTERNAL`

---

## 10. Server Actions do Editor (`app/admin/editor/actions.ts`)

### `saveEditorPost(payload)`

Valida com Zod e salva o post completo:

1. Valida `SaveSchema` (zod)
2. Bloqueia se outro PILLAR já existe no silo (retorna `PILLAR_CONFLICT`)
3. Hidrata `content_json` com metadados extraídos do HTML (imagens, CTAs, tabelas, FAQs)
4. Persiste via `adminUpdatePost`
5. Sincroniza `post_links`
6. Sincroniza `post_link_occurrences` (siloService)
7. Faz upsert em `silo_posts` (hierarquia)
8. Revalida paths Next.js (`revalidatePath`)

### `setEditorPublishState(payload)`

Publica ou despublica um post (toggle).

### `validatePostForPublish(id, context?)`

Checklist de publicação:
- Title presente
- Keyword principal preenchida
- Meta description presente
- Pelo menos 1 link interno

---

## 11. Painel de Administração (`app/admin/page.tsx`)

Dashboard editorial com:

- **KPI Cards**: Total / Rascunhos / Em revisão / Publicados
- **Distribuição por Silo**: progress bar visual (meta: ≥2 posts por silo)
- **Tabela de Posts**: filtrável por status + busca textual, ordenável por status/título/silo/hierarquia/data
- **Ações inline**: Editar | Preview | URL pública | Publicar/Despublicar | Agendar | Deletar

**Hierarquia exibida:**
- `PILLAR` → "Pilar"
- `SUPPORT 1` → "Suporte 1"
- `AUX 3` → "Apoio 3"

---

## 12. SEO: Canonical e Sitemap

### `lib/seo/canonical.ts`

```typescript
// Constrói canonical path de um post
export function buildPostCanonicalPath(siloSlug: string | null, postSlug: string): string | null {
  if (!siloSlug || !postSlug) return null;
  return `/${siloSlug}/${postSlug}`;
}

// Constrói canonical path do hub do silo
export function buildSiloCanonicalPath(siloSlug: string | null): string | null {
  if (!siloSlug) return null;
  return `/${siloSlug}`;
}
```

### `app/sitemap.ts`

Gera sitemap XML dinamicamente incluindo:
- Página inicial
- Hubs de silos (`/[silo]`)
- Posts publicados (`/[silo]/[slug]`)
- `lastModified` = `updated_at` ou `published_at`

---

## 13. Variáveis de Ambiente Necessárias

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role

# Site
SITE_URL=https://seusite.com.br
NEXT_PUBLIC_SITE_URL=https://seusite.com.br

# Admin (autenticação básica opcional)
ADMIN_EMAIL=admin@seusite.com.br
ADMIN_PASSWORD=senha_segura

# Serviços opcionais
GOOGLE_CSE_ID=...
GOOGLE_CSE_KEY=...
```

---

## 14. Dependências Principais (`package.json`)

```json
{
  "dependencies": {
    "next": "16.x",
    "react": "19.x",
    "@supabase/supabase-js": "^2.x",
    "@supabase/ssr": "^0.6.x",
    "@tiptap/core": "3.16.x",
    "@tiptap/react": "3.16.x",
    "@tiptap/starter-kit": "3.16.x",
    "@tiptap/extension-link": "3.16.x",
    "@tiptap/extension-image": "3.16.x",
    "@tiptap/extension-table": "3.16.x",
    "@tiptap/extension-mention": "3.16.x",
    "@tiptap/extension-youtube": "3.16.x",
    "reactflow": "^11.x",
    "cheerio": "^1.x",
    "zod": "^3.x",
    "lucide-react": "^0.4x"
  }
}
```

---

## 15. Fluxo de Criação de um Post Novo

```
1. Admin acessa /admin/editor/new
2. Preenche:
   - Título (= keyword principal)
   - Slug (auto-gerado a partir do título)
   - Silo destino
   - Papel: PILLAR | SUPPORT | AUX
   - Grupo editorial (só para SUPPORT)
   - Ordem no grupo
   - Keywords complementares
3. POST para Server Action → adminCreateDraftPost()
4. Redireciona para /admin/editor/[postId]
5. Editor Tiptap carrega com conteúdo default
6. Escreve conteúdo, ativa painéis SEO/auditoria
7. Salva → saveEditorPost() sincroniza tudo
8. Publica → setEditorPublishState(published: true)
```

---

## 16. Checklist de Replicação para Novo Projeto

- [ ] Criar projeto Supabase
- [ ] Rodar todos os blocos SQL (seções 2.1 a 2.8)
- [ ] Configurar variáveis de ambiente (seção 13)
- [ ] Editar `lib/silo-config.ts` com os silos do novo nicho
- [ ] Editar grupos editoriais se o nicho tiver grupos diferentes (seção 5)
- [ ] Atualizar `app/layout.tsx` com nome, fonte e cores do novo site
- [ ] Atualizar `lib/site.ts` com nome do site, URL e metadados
- [ ] Criar silos no Supabase via admin ou seed script
- [ ] Criar o primeiro pilar de cada silo
- [ ] Verificar `robots.ts` e `sitemap.ts` com domínio correto

---

## 17. Regras de Negócio (Invariantes do Sistema)

1. **Keyword = Título = Slug**: nunca separar. O `target_keyword` define o `title` e o `slug`.
2. **Um PILLAR por silo**: enforced via unique index `idx_posts_unique_pillar_per_silo`.
3. **AUX nunca aparece no menu**: `show_in_silo_menu = false` automático para `AUX`.
4. **AUX nunca tem grupo editorial**: `silo_group = null` automático para `AUX`.
5. **PILLAR nunca tem grupo editorial**: `silo_group = null` automático para `PILLAR`.
6. **Grupos criados automaticamente**: ao criar silo, os 6 grupos padrão são inseridos.
7. **Sincronização de links ao salvar**: toda vez que um post é salvo, `post_links` e `post_link_occurrences` são re-sincronizados.
8. **Checklist de publicação**: o sistema bloqueia publicação se faltar title, keyword ou meta description.
9. **Canonical path**: sempre `/{silo_slug}/{post_slug}`. Gerado automaticamente ao salvar.
