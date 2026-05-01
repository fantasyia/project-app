# Mini WordPress Repository Map

Status: draft operacional inicial  
Data: 2026-04-28

## 1. Como usar este mapa

Antes de alterar um arquivo, classifique a mudanca como:

- `Core`
- `Brand Adapter`
- `Frontend Template`
- `Legacy cleanup`

Se a mudanca cruzar mais de uma classe, registre isso no PR/relatorio para evitar misturar Mini WordPress com uma marca especifica.

## 2. Root

| Caminho | Dono | Regra |
| --- | --- | --- |
| `package.json` | Core / Brand mixed | Scripts sao Core; nome do pacote ainda e CareGlow. |
| `README.md` | Brand / Legacy | Deve virar README neutro depois. |
| `next.config.ts` | Core / Brand mixed | Remote image patterns sao Core; headers de fontes antigas podem ser Brand/Legacy. |
| `tailwind.config.ts` | Core | Tailwind 4 config. |
| `postcss.config.mjs` | Core | Pipeline CSS. |
| `tsconfig.json` | Core | TypeScript. |
| `proxy.ts` | Core | Middleware/proxy do app. |
| `cloudflared.exe` | Tooling | Necessario documentar para Contentor local. |
| `.env.local` | Local secret | Nunca documentar valores reais. |

## 3. App routes

| Caminho | Dono | Observacao |
| --- | --- | --- |
| `app/admin/layout.tsx` | Core | Shell dark do Mini WordPress. |
| `app/admin/page.tsx` | Core | Painel de conteudos. |
| `app/admin/components/AdminHeader.tsx` | Core / Brand Adapter | Header admin e Core; logo/nome devem vir do adapter/env. |
| `app/admin/editor/**` | Core | Rotas do editor. |
| `app/admin/silos/**` | Core | Rotas de silos. |
| `app/admin/preview/**` | Core | Preview privado. |
| `app/admin/login/**` | Core | Auth admin. |
| `app/api/admin/**` | Core | APIs admin/IA/SEO/upload. |
| `app/api/seo/**` | Core | APIs de SEO tecnico. |
| `app/api/serp/**` | Core | SERP. |
| `app/wp-json/wp/v2/**` | Core | Contentor/WordPress adapter. |
| `app/[silo]/page.tsx` | Frontend Template | Pagina publica dinamica de silo. |
| `app/[silo]/[slug]/page.tsx` | Frontend Template | Pagina publica dinamica de post. |
| `app/silos/[silo]/page.tsx` | Legacy / compat | Validar se ainda e necessario. |
| `app/page.tsx` | Frontend Template / Brand | Home estrutural com conteudo de marca. |
| `app/sobre`, `app/contato`, `app/politica-*`, `app/afiliados` | Brand Adapter | Institucionais. |
| `app/<slug>/page.tsx` de artigos/silos | Brand / Legacy | Rotas hardcoded devem sair do pacote neutro. |
| `app/globals.css` | Core / Template / Brand mixed | Precisa dividir por dominio conceitual. |

## 4. Components

### 4.1 Admin

| Caminho | Dono | Observacao |
| --- | --- | --- |
| `components/admin/GoogleIntegrationCard.tsx` | Core | Config Google/CSE. |
| `components/admin/NewPostForm.tsx` | Core | Criacao de post. |
| `components/admin/PostOrganizationForm.tsx` | Core | Organizacao de post. |
| `components/admin/AdminShell.tsx` | Legacy | Shell visual antigo; revisar uso antes de exportar. |

### 4.2 Editor

| Caminho | Dono | Observacao |
| --- | --- | --- |
| `components/editor/AdvancedEditor.tsx` | Core | Orquestrador principal. |
| `components/editor/EditorCanvas.tsx` | Core / Template boundary | Renderiza preview; deve proteger `.editor-public-preview`. |
| `components/editor/EditorContext.tsx` | Core | Estado do editor. |
| `components/editor/ContentIntelligence.tsx` | Core | Painel esquerdo. |
| `components/editor/EditorInspector.tsx` | Core | Painel direito. |
| `components/editor/TermsPanel.tsx` | Core | Termos/LSI IA. |
| `components/editor/InternalLinksPanel.tsx` | Core | Linkagem interna. |
| `components/editor/LinkHygienePanel.tsx` | Core | Higiene de links. |
| `components/editor/GuardianPanel.tsx` | Core | Guardian SEO. |
| `components/editor/TextSearchPanel.tsx` | Core | Busca no artigo. |
| `components/editor/CareGlowBubbleMenu.tsx` | Core / rename needed | Funcao Core com nome de marca. Renomear futuro. |
| `components/editor/extensions/**` | Core | Extensoes Tiptap. |

### 4.3 Silos

| Caminho | Dono | Observacao |
| --- | --- | --- |
| `components/silos/**` | Core | Painel moderno de silos. |
| `components/silo/**` | Core / Legacy | Pode ser mapa antigo/paralelo. Consolidar depois. |

### 4.4 Site

| Caminho | Dono | Observacao |
| --- | --- | --- |
| `components/site/HomeExpandedNav.tsx` | Frontend Template / Brand mixed | Menu 2 linhas e Template; silos hardcoded sao Brand. |
| `components/site/SiteHeader.tsx` | Frontend Template / Brand mixed | Header estrutural; logo hardcoded deve virar adapter. |
| `components/site/SiteFooter.tsx` | Frontend Template / Brand mixed | Rodape estrutural; copy/link/brand devem virar adapter. |
| `components/site/PostToc.tsx` | Frontend Template | Indice do post. |
| `components/site/PostCard.tsx` | Frontend Template | Card editorial. |
| `components/site/HomeClient.tsx` | Frontend Template / Brand mixed | Home publica. |
| `components/site/AffiliateDisclosure.tsx` | Brand / Template | Estrutura reutilizavel, texto de marca/legal. |

## 5. Lib

| Caminho | Dono | Observacao |
| --- | --- | --- |
| `lib/db.ts` | Core | Queries principais. |
| `lib/types.ts` | Core | Tipos gerais. |
| `lib/site.ts` | Brand Adapter | Hardcoded CareGlow. |
| `lib/silo-config.ts` | Core / Brand mixed | Verificar conteudo antes de exportar. |
| `lib/admin/**` | Core | Auth/settings admin. |
| `lib/ai/**` | Core | Provider IA. |
| `lib/editor/**` | Core | Renderer/import/schema. |
| `lib/seo/**` | Core | SEO, links, health, duplicacao. |
| `lib/serp/**` | Core | SERP provider/errors. |
| `lib/google/**` | Core | Google settings/search. |
| `lib/googleCSE/**` | Core | CSE. |
| `lib/silo/**` | Core | Servicos de silo. |
| `lib/site/**` | Brand / Template | Colaboradores, capas, URL publica. |
| `lib/supabase/**` | Core | Clientes. |
| `lib/wp/**` | Core | WP adapter. |

## 6. Database

| Caminho | Dono | Observacao |
| --- | --- | --- |
| `supabase/migrations/**` | Core / Brand mixed | Fonte principal; contem migrations e seeds CareGlow. |
| `supabase/schema.sql` | Snapshot | Parece incompleto contra migrations/app. Usar com cautela. |
| `supabase/seed.json` | Brand / setup | Separar seed Core e Brand. |
| `migrations/**` | Legacy / pending audit | SQL solto fora da fonte principal. |

## 7. Scripts

| Caminho | Dono | Observacao |
| --- | --- | --- |
| `scripts/clone-supabase.ts` | Core | Clone para novo Supabase. Precisa fallback Windows. |
| `scripts/verify-supabase.ts` | Core | Verificacao schema. |
| `scripts/seed.ts` | Core / Brand mixed | Separar seed estrutural e seed de marca. |
| `scripts/seed-silo-organization.ts` | Brand setup | Deve virar exemplo/adapter. |
| `scripts/check-serp.ts` | Core | Diagnostico SERP. |
| `scripts/check-google-cse.ts` | Core | Diagnostico CSE. |
| `scripts/repair-media-paths.ts` | Core tooling | Manutencao. |
| `scripts/test-wp-adapter.ts` | Core tooling | Teste Contentor adapter. |
| `scripts/test_gemini.ts` | Core tooling | Teste IA. |
| `scripts/list_models.ts` | Core tooling | Listagem de modelos. |

## 8. Docs

| Caminho | Dono | Observacao |
| --- | --- | --- |
| `docs/miniwordpress/**` | Canonico | Fonte de verdade nova. |
| `docs/SUPABASE_CLONE_PLAYBOOK.md` | Useful legacy | Migrar/revisar para miniwordpress. |
| `docs/contentor-wp-adapter.md` | Useful legacy | Migrar para Contentor guide. |
| `docs/GUARDIAN_SEO_2_IMPLEMENTATION.md` | Useful legacy | Migrar para AI/SEO docs. |
| `docs/editor-responsive-modes.md` | Useful legacy | Migrar para Editor/Frontend docs. |
| `docs/manual.md` | Legacy | Manual antigo, revisar. |
| `docs/manual-operacional-careglow.md` | Brand | Manual CareGlow. |

## 9. Agent skills

| Caminho | Dono | Observacao |
| --- | --- | --- |
| `.agent/skills/**` | Legacy / inconsistent | Pasta singular e leitura atual inconsistente. |
| `.agents/skills/**` | Canonico futuro | Criar depois da documentacao base. |

## 10. Regras de alteracao

### Quando tocar Core

- Nao introduzir nome de marca.
- Nao depender de cores/fontes publicas da marca.
- Atualizar docs se mudar contrato.
- Rodar build quando tocar codigo.

### Quando tocar Brand Adapter

- Pode mudar nome, logo, dominio, textos, silos iniciais e tom.
- Nao alterar comportamento do admin/core.

### Quando tocar Frontend Template

- Preservar estrutura reutilizavel.
- Nao hardcodar nicho.
- Expor dados via config/adapter.

### Quando tocar Legacy

- Documentar se foi arquivado, migrado ou removido.
- Nao apagar sem confirmacao se houver duvida de uso.
