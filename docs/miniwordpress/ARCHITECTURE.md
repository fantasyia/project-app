# Mini WordPress Architecture

Status: draft tecnico inicial  
Base atual: CareGlow implementation  
Data: 2026-04-28

## 1. Principio arquitetural

Mini WordPress deve ser extraido como um sistema transplantavel com fronteiras claras.

```txt
Project Host
  Public brand/app/site
    Brand Adapter
      nome, dominio, logo, cores, fontes, tom, nicho, prompts, seeds
    Frontend Template
      menu 2 linhas, home editorial, silo page, post page, TOC, footer
  Mini WordPress Core
    admin, editor, IA, SEO, silos, Supabase, Contentor adapter
  Database
    Supabase Postgres + Storage
```

## 2. Camadas

### 2.1 Core

Core e a parte que deve viajar intacta para outros projetos.

Responsabilidades:

- Admin privado.
- Editor Tiptap.
- Workflow editorial.
- SEO tecnico.
- Silo intelligence.
- Internal linking.
- Guardian SEO.
- SERP/revisao.
- Contentor adapter.
- Supabase schema/migrations.
- Scripts de clone/verificacao.

Arquivos atuais principais:

- `app/admin/**`
- `app/api/admin/**`
- `app/api/seo/**`
- `app/wp-json/wp/v2/**`
- `components/editor/**`
- `components/silos/**`
- `lib/editor/**`
- `lib/seo/**`
- `lib/silo/**`
- `lib/wp/**`
- `lib/supabase/**`
- `scripts/clone-supabase.ts`
- `scripts/verify-supabase.ts`

### 2.2 Brand Adapter

Brand Adapter e a camada que troca por projeto.

Responsabilidades:

- Dados da marca.
- Configuracao publica.
- Prompts por nicho.
- Silos iniciais.
- Seeds de exemplo.
- Logo e assets.
- Tom editorial.
- Informacoes legais e afiliados.

Arquivos atuais que devem migrar para adapter:

- `lib/site.ts`
- assets em `public/**`
- seeds CareGlow em `supabase/migrations/**`
- `supabase/seed.json`
- paginas institucionais em `app/sobre`, `app/contato`, `app/politica-*`, `app/afiliados`
- rotas publicas hardcoded de skincare

### 2.3 Frontend Template

Frontend Template e estrutura publica reutilizavel.

Responsabilidades:

- Menu publico de 2 linhas.
- Header publico.
- Footer publico.
- Home editorial.
- Pagina de silo.
- Pagina de post.
- Indice do post.
- Cards/listas editoriais.

Regra:

- Template controla estrutura e comportamento.
- Brand Adapter controla aparencia e conteudo.

Arquivos atuais:

- `components/site/HomeExpandedNav.tsx`
- `components/site/SiteHeader.tsx`
- `components/site/SiteFooter.tsx`
- `components/site/PostToc.tsx`
- `components/site/PostCard.tsx`
- `app/[silo]/page.tsx`
- `app/[silo]/[slug]/page.tsx`

### 2.4 Legacy / Transitional

Legacy e tudo que precisa ser auditado antes de exportar.

Inclui:

- `.agent/skills/**`
- `migrations/**`
- `components/admin/AdminShell.tsx`
- `components/silo/**` se duplicar `components/silos/**`
- docs soltas antigas
- CSS global misturado

## 3. Fluxo de dados

```txt
Author/Admin
  -> /admin
  -> Editor Tiptap
  -> app/admin/actions.ts
  -> lib/db.ts
  -> Supabase tables
  -> public routes /[silo]/[slug]
```

IA e SEO:

```txt
Editor panels
  -> app/api/admin/* or app/api/seo/*
  -> lib/ai, lib/seo, lib/serp, lib/google
  -> external APIs when configured
  -> suggestions back to editor/admin
```

Contentor:

```txt
Contentor
  -> /wp-json/wp/v2/posts or media
  -> lib/wp/*
  -> Supabase
  -> imported draft in /admin
```

Supabase clone:

```txt
operator
  -> scripts/clone-supabase.ts
  -> supabase link/db push
  -> env update
  -> seed
  -> verify
```

## 4. Runtime

### App

- Next.js 16 App Router.
- React 19.
- Tailwind CSS 4.
- TypeScript.

### Editor

- Tiptap 3.
- Custom extensions for images, CTAs, product cards, FAQ, tables, internal links and responsive media.

### Database

- Supabase Postgres.
- Supabase Storage through upload APIs.
- Migrations under `supabase/migrations`.

### External integrations

- Gemini through `lib/ai/gemini.ts`.
- Google CSE / SERP through `lib/google*`, `lib/serp`, API routes.
- Contentor through WordPress-like REST endpoints.
- cloudflared local tunnel when Contentor must reach local dev server.

## 5. Admin architecture

Admin routes live under `/admin`.

Important boundaries:

- `app/admin/layout.tsx` wraps admin in `.admin-app`.
- `.admin-app` owns system dark theme.
- Preview route bypasses admin shell.
- Editor route uses full-screen split layout.
- Non-editor admin routes use scrollable admin shell.

Admin visual contract:

- Always dark.
- Dense layout.
- System font.
- Uppercase panel labels.
- No brand font in admin.
- Brand/article preview excluded through `.editor-public-preview`.

## 6. Public frontend architecture

Public routes currently mix dynamic and hardcoded pages.

Desired future:

- Dynamic silo/post routes are primary.
- Brand pages are provided by Brand Adapter.
- Hardcoded CareGlow pages either become brand example pages or are removed from neutral package.

Important current routes:

- `/`
- `/[silo]`
- `/[silo]/[slug]`
- `/admin`
- `/wp-json/wp/v2/*`

## 7. Database architecture snapshot

Tables seen in `supabase/schema.sql`:

- `silos`
- `posts`
- `silo_batches`
- `silo_batch_posts`
- `post_links`

Additional tables appear in migrations and app code:

- `google_cse_settings`
- `link_audits`
- `post_link_occurrences`
- `silo_audits`
- `silo_groups`
- `silo_posts`
- `wp_app_passwords`
- `wp_id_map`
- `wp_media`

The schema snapshot is incomplete compared with migrations/app usage. `DATABASE_SCHEMA.md` must reconcile migrations and runtime queries before export.

## 8. Risks

- Brand hardcodes may leak into neutral package.
- `migrations/` and `supabase/migrations/` may diverge.
- `supabase/schema.sql` may be stale.
- `scripts/clone-supabase.ts` assumes `pnpm` inside spawned commands.
- CSS global mixes system, template and CareGlow styles.
- Public header currently references Bebe na Rota logo inside CareGlow repo.

## 9. Architecture decisions

### ADR-001: Documentation before extraction

Do not create neutral ZIP before docs classify Core/Brand/Template/Legacy.

### ADR-002: Admin is always Core

Anything under admin/editor/SEO/silos is Core unless it is clearly brand copy or brand asset.

### ADR-003: Public frontend is Template plus Brand

Public menu, post page, silo page, TOC and footer are Template. Their colors, fonts, copy and logo are Brand.

### ADR-004: Supabase migrations are source of truth

Use `supabase/migrations` as intended source. Treat root `migrations/` as pending audit until reconciled.
