# Mini WordPress Implementation no FantasyIA - Raio-X

Status: raio-x inicial  
Data: 2026-04-28  
Modo: projeto existente  
Destino: `C:\Users\Adalba\Documents\project-app`

Atualizacao 2026-04-29:

- primeira implementacao aplicada no runtime do FantasyIA;
- `/dashboard/blog/create` agora usa uma experiencia Mini WordPress com painel esquerdo de inteligencia, editor central e inspector por abas;
- `/blog`, `/blog/s/[silo]` e `/blog/[slug]` foram substituidos por frontend editorial mais completo e adaptado ao FantasyIA;
- Brand Adapter inicial criado em `src/lib/miniwordpress/fantasyia-brand.ts`;
- utilitarios de analise/TOC criados em `src/lib/miniwordpress/article-analysis.ts`;
- build validado com `npm.cmd run build`.

## 1. Decisao de escopo

O Mini WordPress pode substituir o blog atual do FantasyIA.

Escopo autorizado pelo usuario:

- apagar/substituir o blog FantasyIA atual;
- manter o nicho como arte, fotografia, conteudo visual privado premium e creator economy;
- usar o Mini WordPress como modulo editorial publico e backend editorial;
- comecar pelo raio-x antes de mover codigo.

Limite obrigatorio:

- o Mini WordPress nao substitui o app privado;
- nao altera assinatura, PPV, chat, creator studio, admin CRM ou afiliados sem uma decisao separada;
- o blog/editorial continua isolado do dominio principal;
- o backend editorial pode ser desktop-first;
- o blog publico continua mobile-first e dark-only.

## 2. Estado atual verificado

Build atual:

- `npm.cmd run build` passa em 2026-04-28.
- Next lista as rotas publicas atuais do blog:
  - `/blog`
  - `/blog/[slug]`
  - `/blog/s/[silo]`
- Next lista as rotas privadas editoriais atuais:
  - `/dashboard/blog`
  - `/dashboard/blog/create`
  - `/dashboard/blog/[articleId]/edit`
  - `/dashboard/blog/seo`
  - `/dashboard/blog/silos`
- `/dashboard/writer/*` existe como alias legado com redirect para `/dashboard/blog`.

O blog atual ja tem uma implementacao local, mas ela e menor que o Mini WordPress:

- CMS editorial em `/dashboard/blog`;
- editor Tiptap simples;
- upload de cover para bucket `blog-media`;
- tabela `blog_articles`;
- silos basicos por `silos`, `silo_groups` e `silo_posts` quando o banco suporta;
- frontend publico mobile-first em `/blog`;
- auditoria SEO simples;
- role canonica `editor`, com aliases legados `writer` e `blog`.

## 3. Arquivos atuais que pertencem ao blog substituivel

### Publico / frontend editorial

- `src/app/blog/page.tsx`
- `src/app/blog/[slug]/page.tsx`
- `src/app/blog/[slug]/not-found.tsx`
- `src/app/blog/s/[silo]/page.tsx`
- `src/components/blog/article-rich-content.tsx`

Classificacao: substituir por Frontend Template do Mini WordPress adaptado ao FantasyIA.

### Backend editorial atual

- `src/app/dashboard/blog/layout.tsx`
- `src/app/dashboard/blog/page.tsx`
- `src/app/dashboard/blog/create/page.tsx`
- `src/app/dashboard/blog/create/create-article-editor.tsx`
- `src/app/dashboard/blog/[articleId]/edit/page.tsx`
- `src/app/dashboard/blog/seo/page.tsx`
- `src/app/dashboard/blog/silos/page.tsx`
- `src/components/blog/rich-text-editor.tsx`

Classificacao: substituir por Mini WordPress Core administrativo/editorial, mantendo a rota de entrada ou criando redirect controlado.

### Actions e tipos atuais

- `src/lib/actions/blog.ts`
- `src/lib/actions/silo.ts`
- `src/lib/blog/content.ts`
- `src/lib/blog/types.ts`

Classificacao: migrar ou substituir por services/actions do Mini WordPress. O conteudo reaproveitavel e a camada de compatibilidade HTML legado podem ser preservados se ajudarem na migracao.

### Banco / schema atual

- `src/lib/database/schema.ts`
- `supabase/migrations/0001_ambitious_warpath.sql`
- migrations posteriores podem conter colunas e tabelas usadas por silos.

Classificacao: reconciliar antes de aplicar qualquer migration do Mini WordPress. Nao apagar tabelas existentes sem migration segura.

## 4. Rotas de encaixe recomendadas

Para este app, existem duas estrategias possiveis.

### Estrategia A - manter as rotas FantasyIA atuais

- Publico:
  - `/blog`
  - `/blog/s/[silo]`
  - `/blog/[slug]`
- Admin/editor:
  - `/dashboard/blog`
  - `/dashboard/blog/editor/[postId]` ou `/dashboard/blog/[articleId]/edit`
  - `/dashboard/blog/silos`

Vantagem: preserva RBAC atual, middleware e links ja existentes.

### Estrategia B - instalar Mini WordPress em ilha `/admin`

- Mini WordPress Core:
  - `/admin`
  - `/admin/editor/[postId]`
  - `/admin/silos`
  - `/admin/preview/[postId]`
- Publico:
  - `/blog`
  - `/blog/s/[silo]`
  - `/blog/[slug]`

Vantagem: mais proximo do produto Mini WordPress neutro.

Recomendacao inicial: Estrategia A, porque o FantasyIA ja possui RBAC e area editorial canonica em `/dashboard/blog`. A rota `/admin` deve continuar reservada para o Admin CRM do produto, a menos que o usuario decida separar isso depois.

## 5. Brand Adapter FantasyIA

Brand Adapter inicial:

- Marca: FantasyIA
- Nicho: arte, fotografia, lifestyle visual, creator economy e conteudo visual privado premium
- Blog publico: topo de funil e SEO
- Tom: editorial premium, direto, visual, estrategico e voltado para creators e assinantes
- Admin/editor: dark-only, denso, sem depender da marca visual publica
- Frontend publico: mobile-first, escuro, com conversao para descoberta, pricing, creator profiles e assinatura

Silos iniciais recomendados:

- Arte IA e fotografia
- Creator economy premium
- Conteudo visual privado
- Monetizacao e assinaturas
- Comunidade e engajamento
- Seguranca, direitos e compliance

Grupos editoriais iniciais:

- Guias praticos
- Tendencias visuais
- Estrategia de monetizacao
- Operacao de creators
- SEO e descoberta
- Compliance e protecao de conteudo

## 6. Conflitos e riscos antes da implementacao

1. `blog_articles` no Drizzle esta mais simples que o runtime.
   - O codigo usa campos como `meta_title`, `meta_description`, `target_keyword`, `canonical_path`, `silo_id`, `silo_role`, `silo_group`, `category`, `tags`, `schema_type` e `intent`.
   - O trecho principal do schema local visto no Drizzle ainda declara apenas os campos base.
   - Antes da troca, e preciso reconciliar migrations e schema.

2. O Mini WordPress documentado usa `/admin`, mas o FantasyIA ja tem Admin CRM em `/dashboard/admin`.
   - Evitar criar ambiguidade entre Admin CRM e admin editorial.
   - Preferir manter o editor em `/dashboard/blog` por enquanto.

3. O blog atual usa role `editor`.
   - Isso esta correto para FantasyIA.
   - O enum legado ainda pode carregar `writer`; manter aliases durante a migracao.

4. O frontend publico atual esta mobile-first e escuro.
   - O Mini WordPress Template precisa respeitar isso.
   - Nao importar frontend claro ou CareGlow-specific.

5. O Core completo do Mini WordPress ainda nao esta no runtime deste repo.
   - A pasta `docs/miniwordpress` existe.
   - O app atual ainda nao tem `components/editor/**`, `components/silos/**`, `lib/seo/**`, `lib/wp/**` ou `app/wp-json/**` do Mini WordPress neutro.
   - A implementacao precisa copiar/criar esses modulos em etapas.

## 7. Mapa de migracao recomendado

### Fase 1 - Preparacao sem quebrar rota

- Criar Brand Adapter FantasyIA.
- Reconciliar schema editorial real:
  - `blog_articles`;
  - `silos`;
  - `silo_groups`;
  - `silo_posts`;
  - tabelas futuras de links, auditoria, Contentor e SEO.
- Definir contrato de rotas final em `/dashboard/blog` e `/blog`.
- Manter build verde.

### Fase 2 - Substituir backend editorial

- Trocar o CMS simples por shell Mini WordPress em `/dashboard/blog`.
- Evoluir editor Tiptap para painel completo:
  - busca no artigo;
  - outline H2/H3/H4;
  - links internos;
  - Link Hygiene;
  - Guardian SEO;
  - Termos / LSI;
  - revisao SERP.
- Manter compatibilidade com artigos existentes.

### Fase 3 - Substituir frontend publico do blog

- Recriar `/blog` com template editorial do Mini WordPress adaptado ao FantasyIA.
- Recriar `/blog/s/[silo]`.
- Recriar `/blog/[slug]` com TOC, estrutura de artigo, metadados e CTA para o app.
- Validar mobile-first.

### Fase 4 - IA, SEO e Contentor

- Adicionar rotas/API de IA e SEO.
- Adicionar Contentor/WordPress adapter se for usado.
- Adicionar migrations auxiliares.
- Criar prompt pack FantasyIA.

### Fase 5 - Limpeza e validação

- Remover blog antigo depois da substituicao estar compilando.
- Atualizar SDD e docs Mini WordPress com o estado real.
- Rodar:
  - `npm.cmd run build`
  - `npm.cmd run lint`
  - QA visual das rotas publicas e privadas editoriais

## 8. Criterio de pronto para esta substituicao

O Mini WordPress estara implementado no FantasyIA quando:

- `/dashboard/blog` abrir o backend editorial Mini WordPress;
- `/blog`, `/blog/s/[silo]` e `/blog/[slug]` usarem o novo frontend editorial;
- o app privado continuar funcionando sem mudanca de dominio;
- o build passar;
- roles `editor` e aliases legados continuarem consistentes;
- as tabelas editoriais estiverem reconciliadas em migrations/schema;
- o Brand Adapter FantasyIA estiver separado do Core;
- nao houver CareGlow, Bebe na Rota ou outro hardcode externo no runtime do FantasyIA.

## 9. Implementacao aplicada em 2026-04-29

Arquivos principais alterados/criados:

- `src/lib/miniwordpress/fantasyia-brand.ts`
- `src/lib/miniwordpress/article-analysis.ts`
- `src/app/dashboard/blog/create/create-article-editor.tsx`
- `src/components/blog/rich-text-editor.tsx`
- `src/components/blog/article-rich-content.tsx`
- `src/app/dashboard/blog/layout.tsx`
- `src/app/blog/page.tsx`
- `src/app/blog/[slug]/page.tsx`
- `src/app/blog/s/[silo]/page.tsx`

O que entrou:

- Brand Adapter FantasyIA com nicho, tom, silos fallback, links e placeholders editoriais.
- Editor Mini WordPress em `/dashboard/blog/create`, mantendo as actions existentes de `createArticle` e `updateArticle`.
- Painel esquerdo com:
  - busca no artigo;
  - estrutura H2/H3/H4;
  - links internos IA como assistente operacional;
  - higiene/Guardiao SEO;
  - Termos / LSI.
- Inspector direito com abas:
  - Post;
  - SEO;
  - Review;
  - E-E-A-T;
  - Publish.
- Toolbar Tiptap com H4.
- Preview publico isolado por `.editor-public-preview`.
- Blog publico com home editorial, menu de silos, destaque, cards e CTA.
- Pagina de post com TOC baseado em headings reais.
- Hub de silo com pilar, suporte, complementares, grupos e KPIs.

Limites que permanecem:

- IA real, Contentor/WordPress adapter e migrations adicionais ainda nao foram conectados nesta passada.
- O banco foi preservado; nenhuma tabela foi apagada ou recriada.
- As outras areas do app nao foram alteradas por escopo: subscriber, creator, admin CRM, affiliate, checkout, PPV e chat.

## 10. Correcao estrutural aplicada em 2026-04-29

A primeira implementacao foi considerada superficial e foi substituida por uma estrutura mais proxima do Mini WordPress documentado.

Novas pastas Core criadas:

- `src/components/admin/`
- `src/components/editor/`
- `src/components/silos/`
- `src/lib/editor/`
- `src/lib/seo/`
- `src/lib/silo/`
- `src/lib/wp/`

Rotas privadas editoriais agora existentes:

- `/dashboard/blog`
  - cockpit editorial com tabela operacional de conteudo;
  - filtros, status, capa, slug, silo, hierarquia e acoes de publicacao.
- `/dashboard/blog/create`
  - entrada de novo post usando `components/editor/AdvancedEditor.tsx`;
  - remove a dependencia do editor superficial anterior.
- `/dashboard/blog/editor/[articleId]`
  - editor de posts em estrutura Mini WordPress.
- `/dashboard/blog/silos`
  - listagem densa de silos e hubs.
- `/dashboard/blog/silos/[slug]`
  - painel do silo com abas: Metadados, Visao Geral, Mapa de Links, Canibalizacao e SERP.

Migration Supabase criada:

- `supabase/migrations/0008_miniwordpress_editorial_core.sql`

Decisao de banco:

- O FantasyIA ja possui uma tabela `posts` ligada ao app privado/social.
- Para nao quebrar subscriber, creator, PPV, chat ou feed, a migration nao sobrescreve essa tabela.
- O blog antigo (`blog_articles`) foi evoluido para funcionar como tabela de posts editoriais do Mini WordPress.
- Foi criada a view `miniwordpress_posts` para expor o contrato de posts do Mini WordPress sem colisao com o dominio privado.
- Foram adicionadas tabelas Core:
  - `post_links`;
  - `post_link_occurrences`;
  - `link_audits`;
  - `silo_audits`;
  - `google_cse_settings`;
  - `wp_app_passwords`;
  - `wp_id_map`;
  - `wp_media`.

Validacao:

- `npm.cmd run build` passou.
- `npm.cmd run lint` passou sem erros.
- `/blog` respondeu `200 OK`.
- `/dashboard/blog/create` respondeu `307 Temporary Redirect`, esperado por ser rota privada protegida por sessao.
