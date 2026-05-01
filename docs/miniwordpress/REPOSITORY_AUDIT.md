# Repository Audit: Mini WordPress Extraction

Status: raio-x inicial  
Base: `C:\Users\Adalba\Documents\adalba-pro\skincare-affiliate-blog-main`  
Data: 2026-04-28

## 1. Estado geral

O repositorio atual e uma implementacao funcional do blog CareGlow com um CMS interno forte o suficiente para virar Mini WordPress.

Mas ele ainda nao esta separado como produto. Existem hardcodes de marca, docs antigas, skills CareGlow e migrations duplicadas/soltas.

## 2. Classificacao por pasta

| Caminho | Classe | Observacao |
| --- | --- | --- |
| `app/admin/**` | Core | Admin privado do Mini WordPress. Deve ser mantido dark/denso e brand-independent. |
| `app/api/admin/**` | Core | APIs administrativas, IA, upload, SERP, links e WP app password. |
| `app/api/seo/**` | Core | Plagio, CSE, duplicacao interna. |
| `app/wp-json/wp/v2/**` | Core | Adapter WordPress-like para Contentor. |
| `components/editor/**` | Core | Editor Tiptap, paineis, extensoes, toolbar e inteligencia. |
| `components/silos/**` | Core | Painel moderno de silos, grafo, saude, SERP e canibalizacao. |
| `components/silo/**` | Core / Legacy | Mapa/grafo antigo ou paralelo; precisa consolidar com `components/silos`. |
| `lib/editor/**` | Core | Rendering, Contentor import, blocos e responsividade. |
| `lib/seo/**` | Core | Link semantics, silo health, duplicacao, plagio, canonical. |
| `lib/silo/**` | Core | Servicos e tipos de silo. |
| `lib/wp/**` | Core | Compatibilidade WordPress adapter. |
| `lib/supabase/**` | Core | Clientes Supabase admin/public. |
| `lib/ai/**` | Core | Gemini provider; precisa documentar env e prompts. |
| `scripts/clone-supabase.ts` | Core | Script de clone, mas precisa revisao Windows/fallback. |
| `scripts/verify-supabase.ts` | Core | Verificacao de schema. |
| `scripts/check-serp.ts` | Core | Diagnostico SERP. |
| `scripts/check-google-cse.ts` | Core | Diagnostico Google CSE. |
| `scripts/seed.ts` | Core / Brand | Provavelmente mistura seed estrutural e CareGlow. Precisa separar. |
| `scripts/seed-silo-organization.ts` | Brand / Setup | Pode virar exemplo de Brand Adapter. |
| `components/site/HomeExpandedNav.tsx` | Frontend Template / Brand mixed | Estrutura do menu e Template; itens hardcoded CareGlow. |
| `components/site/SiteHeader.tsx` | Frontend Template / Brand mixed | Estrutura do header; logo hardcoded de Bebe na Rota. |
| `components/site/SiteFooter.tsx` | Frontend Template / Brand mixed | Estrutura reutilizavel, textos da marca precisam adapter. |
| `components/site/PostToc.tsx` | Frontend Template | Indice do post reaproveitavel. |
| `components/site/HomeClient.tsx` | Frontend Template / Brand mixed | Home publica; precisa separar layout e copy. |
| `app/[silo]/**` | Frontend Template | Rotas dinamicas publicas de silo/post. |
| `app/silos/[silo]/**` | Legacy / compat | Possivel rota antiga/paralela. Validar uso. |
| `app/<slug>/page.tsx` publicas | Brand / Legacy | Rotas publicas hardcoded por CareGlow/skincare. |
| `lib/site.ts` | Brand Adapter | Hoje hardcoded CareGlow; deve virar configuracao por marca. |
| `public/**` | Brand | Assets de marca e imagens. Tem arquivo Bebe na Rota em repo CareGlow. |
| `app/globals.css` | Core / Template / Brand mixed | Mistura admin system, CareGlow public theme, template classes. Precisa dividir por dominio. |
| `docs/**` | Legacy / docs source | Conteudo util, mas fora da estrutura canonica. |
| `.agent/skills/**` | Legacy | Singular `.agent`; skills atuais nao sao o pacote final Mini WordPress. |
| `migrations/**` | Legacy / pending audit | SQL solto fora da fonte principal. |
| `supabase/migrations/**` | Core / Brand mixed | Fonte principal, mas contem seeds CareGlow. |
| `supabase/seed.json` | Brand / setup | Deve separar seed core e seed brand. |
| `cloudflared.exe` | Tooling | Necessario para Contentor local; precisa doc propria. |
| `package.json` | Core / Brand mixed | Scripts core, nome `careglow-affiliate-platform`. |
| `README.md` | Legacy / Brand | README CareGlow; precisa README Mini WordPress neutro depois. |

## 3. Core confirmado

### Admin

- `app/admin/page.tsx`
- `app/admin/layout.tsx`
- `app/admin/components/AdminHeader.tsx`
- `app/admin/actions.ts`
- `components/admin/**`

Observacao: `components/admin/AdminShell.tsx` parece legado visual mais antigo e deve ser revisado antes de virar Core.

### Editor

- `components/editor/AdvancedEditor.tsx`
- `components/editor/EditorCanvas.tsx`
- `components/editor/EditorContext.tsx`
- `components/editor/EditorInspector.tsx`
- `components/editor/ContentIntelligence.tsx`
- `components/editor/TermsPanel.tsx`
- `components/editor/InternalLinksPanel.tsx`
- `components/editor/LinkHygienePanel.tsx`
- `components/editor/GuardianPanel.tsx`
- `components/editor/TextSearchPanel.tsx`
- `components/editor/extensions/**`

### Silo intelligence

- `components/silos/SiloIntelligenceTabs.tsx`
- `components/silos/SiloLinkGraph.tsx`
- `components/silos/SiloPostsTable.tsx`
- `components/silos/SiloCannibalizationPanel.tsx`
- `components/silos/SiloSerpPanel.tsx`
- `components/silos/SiloHealthPanel.tsx`

### SEO / IA / SERP

- `lib/seo/**`
- `lib/serp/**`
- `lib/google/**`
- `lib/googleCSE/**`
- `lib/ai/gemini.ts`
- `app/api/admin/internal-link-suggestions/route.ts`
- `app/api/admin/improve-fragment/route.ts`
- `app/api/admin/entity-suggestions/route.ts`
- `app/api/admin/guardian-ai/route.ts`
- `app/api/admin/serp/route.ts`

## 4. Brand/CareGlow confirmado

- `lib/site.ts`: nome, dominio, descricao, email e disclosure CareGlow.
- `package.json`: nome do pacote CareGlow.
- `README.md`: README CareGlow.
- `docs/manual-operacional-careglow.md`.
- `app/afiliados/page.tsx`, `app/sobre/page.tsx`, `app/contato/page.tsx`, `app/politica-*`: textos institucionais da marca.
- Rotas publicas por slug de skincare (`app/protecao-solar`, `app/rotina-skincare-facial`, etc.).
- Seeds CareGlow em `supabase/migrations` e `supabase/seed.json`.
- `components/editor/CareGlowBubbleMenu.tsx`: comportamento Core com nome de marca no arquivo.

## 5. Frontend Template confirmado

- `components/site/HomeExpandedNav.tsx`: estrutura do menu de 2 linhas.
- `components/site/SiteHeader.tsx`: header publico, busca, mobile/desktop.
- `components/site/SiteFooter.tsx`: rodape estrutural.
- `components/site/PostToc.tsx`: indice.
- `components/site/PostCard.tsx`: card de post.
- `app/[silo]/page.tsx` e `app/[silo]/[slug]/page.tsx`: rotas dinamicas publicas.
- Classes `system-silo-nav-*` em `app/globals.css`.

## 6. Problemas encontrados

### 6.1 `.agent` vs `.agents`

Existe `.agent/skills`, mas o plano de produto deve usar `.agents/skills`. Isso deve ser migrado com cuidado:

- Manter `.agent` por enquanto para nao quebrar referencias antigas.
- Criar `.agents/skills` como destino canonico.
- Registrar skills antigas como legacy.

### 6.2 Migrations duplicadas

Existem duas areas:

- `migrations/`
- `supabase/migrations/`

Pelo README e playbook, a fonte pretendida e `supabase/migrations`. A pasta `migrations/` precisa ser classificada arquivo por arquivo antes de mover/remover.

### 6.3 Brand hardcoded no frontend

`HomeExpandedNav.tsx` tem silos hardcoded de CareGlow.  
`SiteHeader.tsx` usa `HEADER_LOGO_SRC = "/logomarca-bebe-na-rota.webp"`, que nem pertence claramente a CareGlow.  
`lib/site.ts` e todo CareGlow.

### 6.4 Docs antigas

Docs uteis existem, mas estao soltas:

- `docs/SUPABASE_CLONE_PLAYBOOK.md`
- `docs/contentor-wp-adapter.md`
- `docs/GUARDIAN_SEO_2_IMPLEMENTATION.md`
- `docs/editor-responsive-modes.md`
- `docs/manual.md`
- `docs/manual-operacional-careglow.md`

Precisam ser reorganizadas em `docs/miniwordpress/` por area.

### 6.5 Supabase clone ainda nao validado agora

O script existe, mas nao foi executado nesta auditoria porque exige credenciais de projeto destino. Ele tambem usa `pnpm` internamente; em Windows pode ser necessario documentar fallback com `corepack pnpm` ou `npm.cmd` conforme ambiente.

### 6.6 CSS misturado

`app/globals.css` contem:

- tema publico CareGlow,
- classes do editor,
- dark mode do admin,
- template de menu,
- componentes publicos.

Precisa virar pelo menos uma separacao conceitual documentada antes de refatorar.

## 7. Documentos que devem ser criados

Prioridade alta:

1. `ARCHITECTURE.md`
2. `REPOSITORY_MAP.md`
3. `DATABASE_SCHEMA.md`
4. `SUPABASE_CLONE_PLAYBOOK.md` revisado dentro de `docs/miniwordpress`
5. `CONTENTOR_CLOUDFLARED.md`
6. `ADMIN_UI_SYSTEM.md`
7. `EDITOR_SYSTEM.md`
8. `SILOS_AND_SEO_SYSTEM.md`
9. `AI_PROMPTS_AND_BRAND_ADAPTER.md`
10. `FRONTEND_TEMPLATE.md`
11. `BRAND_ADAPTER_GUIDE.md`
12. `IMPLEMENTATION_CHECKLIST.md`

## 8. Proximas acoes recomendadas

1. Criar `ARCHITECTURE.md` com diagrama Core/Brand/Template.
2. Criar `REPOSITORY_MAP.md` com dono de cada pasta.
3. Revisar `SUPABASE_CLONE_PLAYBOOK.md` e alinhar com `scripts/clone-supabase.ts`.
4. Criar `.agents/skills` canonico.
5. Transformar `HomeExpandedNav.tsx` em template alimentado por dados/config, sem hardcode CareGlow.
6. Extrair `lib/site.ts` para Brand Adapter.
7. Separar `app/globals.css` por dominio conceitual antes de refatorar fisicamente.

## 9. Regra para agentes futuros

Nao tratar este repositorio como apenas CareGlow.

Toda mudanca nova deve declarar se pertence a:

- Core
- Brand Adapter
- Frontend Template
- Legacy cleanup

Se tocar frontend publico, verificar se a mudanca e estrutural do Template ou estilo da marca.

Se tocar admin/editor/SEO/silos, assumir Core ate prova em contrario.
