# Manual Operacional do CareGlow

Data da radiografia: 2026-03-10

Este documento descreve o estado atual do codigo, nao o estado ideal do projeto. A ideia e servir como mapa tecnico para quem for manter, corrigir ou expandir o site.

## 1. Resumo executivo

Hoje o projeto tem 3 camadas principais:

1. Site publico em Next.js App Router.
2. CMS interno em `/admin` com editor Tiptap.
3. Camada SEO/silos/links internos apoiada em Supabase.

O fluxo central e:

1. O editor salva metadados e conteudo em `posts`.
2. O save sincroniza hierarquia do silo em `silo_posts`.
3. O save extrai links simples para `post_links`.
4. O save sincroniza ocorrencias detalhadas em `post_link_occurrences`.
5. Auditorias gravam sinais em `link_audits` e `silo_audits`.
6. O site publico le `silos` e `posts` para renderizar hubs e artigos.

## 2. Stack e fonte de verdade

- Framework: Next.js App Router
- UI: React + Tailwind
- Editor: Tiptap
- Banco: Supabase/Postgres
- Storage: Supabase Storage
- SEO auxiliar: Google CSE, SERP cache, heuristicas internas e IA

Fontes de verdade por assunto:

- Conteudo do artigo: `posts.content_json` com fallback inteligente para `posts.content_html`
- Metadados do artigo: tabela `posts`
- Metadados do silo: tabela `silos`
- Grupos editoriais: tabela `silo_groups`
- Hierarquia do silo: colunas em `posts` + tabela `silo_posts`
- Links simples: tabela `post_links`
- Links auditaveis: tabela `post_link_occurrences`
- Auditoria de link e saude: `link_audits` e `silo_audits`

## 3. Mapa de rotas

### 3.1 Rotas publicas principais

```txt
/                              -> home
/[silo]                        -> hub dinamico por silo
/[silo]/[slug]                 -> artigo publico
/silos/[silo]                  -> redirect legado para /[silo]
```

Rotas institucionais:

```txt
/sobre
/colaboradores
/contato
/afiliados
/politica-editorial
/politica-de-privacidade
```

### 3.2 Rotas de admin

```txt
/admin                         -> lista editorial de posts
/admin/editor/new              -> cria rascunho e redireciona
/admin/editor/[postId]         -> editor principal
/admin/preview/[postId]        -> preview privado
/admin/silos                   -> lista de silos
/admin/silos/[slug]            -> painel principal do silo
/admin/silos/[slug]/links      -> visao antiga de links do silo
/admin/silos/[slug]/map        -> mapa antigo do silo
```

### 3.3 APIs mais importantes

```txt
/api/admin/internal-link-suggestions
/api/admin/link-audits
/api/admin/silo-posts
/api/admin/entity-suggestions
/api/admin/guardian-ai
/api/seo/plagiarism
/api/seo/internal-duplication
/wp-json/wp/v2/posts
/wp-json/wp/v2/media
/wp-json/wp/v2/users/me
```

## 4. Modelo de dados principal

### 4.1 `silos`

Guarda a casca publica do tema:

- nome
- slug
- descricao
- meta title / meta description
- hero image
- `pillar_content_html`
- ordem de menu
- flags de visibilidade

### 4.2 `posts`

Guarda o estado editorial e publico do artigo:

- titulo
- slug
- keyword principal (`target_keyword`)
- keywords complementares (`supporting_keywords`)
- schema
- E-E-A-T
- imagens
- status de publicacao
- `content_json`
- `content_html`
- metadados do silo (`silo_role`, `silo_group`, `silo_order`, `show_in_silo_menu`)

### 4.3 `silo_groups`

Guarda os grupos editoriais do hub. O projeto ja nasce com estes grupos padrao:

1. `preco_oportunidade`
2. `decisao_escolha`
3. `tipos`
4. `uso_como_fazer`
5. `marcas_produtos`
6. `resultados_tempo`

### 4.4 `silo_posts`

Guarda o identificador de hierarquia do post dentro do silo:

- `role`: `PILLAR`, `SUPPORT`, `AUX`
- `position`: numero do post dentro do papel

Importante: hoje a hierarquia fica duplicada entre `posts` e `silo_posts`. O save tenta manter tudo sincronizado.

### 4.5 Tabelas de links

- `post_links`: camada simples, por post, usada por telas antigas e por algumas validacoes
- `post_link_occurrences`: camada detalhada por ocorrencia, com bucket de posicao, rel flags e alvo resolvido
- `link_audits`: qualidade de cada ocorrencia
- `silo_audits`: saude geral do silo

## 5. Como o site publico funciona

### 5.1 Artigo publico

A rota `app/[silo]/[slug]/page.tsx` e a pagina publica mais completa do projeto.

Ela faz:

1. Carrega o post publicado do Supabase.
2. Monta canonical.
3. Monta Open Graph e Twitter.
4. Resolve o HTML final com `resolveContentHtmlForRender`.
5. Renderiza JSON-LD de artigo, review, FAQ, HowTo, ItemList, VideoObject e breadcrumb.
6. Exibe autor, revisor, fontes e disclaimer.

### 5.2 Fonte de renderizacao do conteudo

O site nao usa cegamente `content_json` nem `content_html`.

`lib/editor/resolveContentHtml.ts` tenta:

1. Renderizar `content_json` para HTML.
2. Comparar com `content_html`.
3. Se o JSON perdeu imagem, CTA ou muito texto, cai para `content_html`.

Na pratica, a publicacao usa um modelo hibrido para evitar perda visual depois da importacao ou edicao.

### 5.3 SEO tecnico

- `app/sitemap.ts` gera sitemap a partir de silos e posts publicados.
- `app/robots.ts` bloqueia `/admin`, `/api` e `/wp-json`.
- `lib/seo/canonical.ts` padroniza canonicals do hub e do artigo.

## 6. Como o admin funciona

### 6.1 Lista editorial `/admin`

Funciona como cockpit de conteudo:

- filtra por status
- busca por titulo/slug
- mostra silo e hierarquia
- abre editor, preview e URL publica
- permite publicar, despublicar, agendar e apagar

### 6.2 Criacao de novo post

`/admin/editor/new`:

1. valida se o schema do banco tem as colunas esperadas
2. cria um rascunho no primeiro silo disponivel
3. redireciona para `/admin/editor/[postId]`

### 6.3 Layout do editor

O editor e um layout de 3 colunas:

1. esquerda: inteligencia
2. centro: canvas/preview/editacao
3. direita: inspector editorial

O header do admin muda quando a rota e de editor e reserva um slot central para os controles principais.

## 7. Como o editor funciona

### 7.1 Estrutura geral

Componente central: `components/editor/AdvancedEditor.tsx`

Ele monta:

- instancia do Tiptap
- estado do post
- autosave
- uploads
- dialogs
- modo responsivo
- sincronizacao com links
- regras de publicacao

### 7.2 Autosave

O editor agenda autosave cerca de 12 segundos depois da ultima mudanca.

No save, ele:

1. normaliza metadados
2. monta canonical
3. grava `posts`
4. extrai `post_links`
5. sincroniza `post_link_occurrences`
6. sincroniza `silo_posts`
7. revalida home, hub, post e sitemap

### 7.3 Reimportacao de conteudo

Ao abrir um post, `/admin/editor/[postId]` pode reimportar `content_html` com `contentorImport` se detectar:

- CTA colapsado
- tokens `LINK_CANDIDATE`
- perda de texto
- ausencia de sinais de edicao manual

Ou seja: a importacao do Contentor nao e so um passo inicial. Ela tambem entra na hidratacao do editor quando o documento salvo parece incompleto.

### 7.4 Modos responsivos

Regra atual do codigo:

- conteudo e unico
- estrutura do documento e global
- imagem, CTA e tabela podem ter override por `desktop`, `tablet` e `mobile`

Referencia rapida ja existente:

- `docs/editor-responsive-modes.md`

## 8. Paineis do editor

### 8.1 Coluna esquerda: inteligencia

Arquivo principal: `components/editor/ContentIntelligence.tsx`

Paineis ativos:

1. Estrutura do texto
2. Links Internos IA
3. Links do artigo / higiene de links
4. Guardiao SEO
5. Buscar no artigo
6. Termos / LSI
7. Analise SERP do post

### 8.2 O que cada painel faz

`InternalLinksPanel`

- pede sugestoes em `/api/admin/internal-link-suggestions`
- respeita hierarquia do silo
- sugere ancora natural
- pode aplicar manualmente ou em lote com confirmacao

`LinkHygienePanel`

- lista todos os links do documento
- mostra tipo, posicao e problemas
- permite editar `_blank`, `nofollow`, `sponsored`, `about`, `mention`
- permite remover links
- cruza com `link_audits`

`GuardianPanel`

- roda checklist rapido de SEO on-page
- mede densidade de keyword, links internos cedo, alt text, E-E-A-T e schema
- pode pedir ajustes sugeridos por IA

`TextSearchPanel`

- faz busca navegavel dentro do artigo
- tem popup rapido via evento do editor

`TermsPanel`

- acompanha termos, LSI e entidades
- compara uso real contra faixa sugerida
- pode pedir entidades por IA
- pode aplicar links semanticos `about` ou `mention`

`SerpAnalysisPanel`

- compara o post com a SERP da keyword alvo

### 8.3 Coluna direita: inspector

Arquivo principal: `components/editor/EditorInspector.tsx`

Abas:

1. Post
2. SEO / KGR
3. Revisao
4. E-E-A-T
5. Publicar

`Post`

- titulo
- capa
- alt da capa
- introducao/meta description
- biblioteca de imagens do post

`SEO / KGR`

- slug
- keyword principal
- meta title
- meta description
- keywords complementares
- entidades
- preview Google / Open Graph / Twitter

`Revisao`

- plagio externo via `/api/seo/plagiarism`
- duplicacao interna via `/api/seo/internal-duplication`
- checklist de schema

`E-E-A-T`

- autor
- sameAs
- revisor
- data de revisao
- disclaimer

`Publicar`

- status
- silo
- papel no silo
- grupo editorial
- numero do post
- ordem do grupo
- visibilidade no hub
- agendamento
- canonical

## 9. Sistema de silos

### 9.1 Painel principal do silo

Rota ativa: `/admin/silos/[slug]`

Componente principal: `components/silos/SiloIntelligenceTabs.tsx`

Abas:

1. Metadados
2. Visao Geral
3. Mapa de Links
4. Canibalizacao
5. SERP

`Metadados`

- edita dados do silo
- gerencia grupos editoriais
- organiza posts visiveis no hub

`Visao Geral`

- KPIs de links
- tabela por post

`Mapa de Links`

- grafo com React Flow
- auditoria do silo
- painel inspector lateral

`Canibalizacao`

- pares de posts por sobreposicao de intencao

`SERP`

- consulta SERP do tema ou do post escolhido

### 9.2 Como a hierarquia e aplicada

Hoje a logica operacional e:

1. O editor define `PILLAR`, `SUPPORT` ou `AUX`.
2. O editor define o numero do post (`position`).
3. Suporte recebe grupo editorial e ordem.
4. Apoio nao entra no menu do hub.
5. Pilar nao usa grupo nem ordem de grupo.

### 9.3 Hubs publicos

Existem 2 modelos no codigo:

1. Hub dinamico em `app/[silo]/page.tsx`, que le `silos` e `posts` do banco.
2. Hubs fisicos em `app/produto-de-skin-care/page.tsx`, `app/produtos-para-clarear-a-pele/page.tsx` etc, que renderizam `components/silo/SiloHub`.

Isso e importante: para os 8 silos fisicos do projeto, a rota fisica vence a dinamica. Na pratica, os hubs reais do CareGlow estao hoje presos nas paginas placeholder do `SiloHub`, e nao no hub dinamico baseado no banco.

## 10. Sistema de links internos

### 10.1 Pipeline completo

1. O editor sugere links internos com IA + heuristica.
2. O usuario aplica o link no documento.
3. No save, `saveEditorPost` extrai links do `content_json` e grava em `post_links`.
4. No mesmo save, `syncLinkOccurrences` percorre o HTML e grava ocorrencias em `post_link_occurrences`.
5. Auditorias populam `link_audits`.
6. O painel de silo le essas tabelas para grafo, score e recomendacoes.

### 10.2 Regras de sugestao

`/api/admin/internal-link-suggestions` considera:

- papel atual do post
- papel do alvo
- posicao no silo
- cobertura semantica
- bucket da ancora no texto (`START`, `MID`, `END`)
- ocorrencias ja linkadas
- ancora natural discriminativa

O retorno final mistura heuristica local e IA, mas o sistema consegue responder tambem so com heuristica.

### 10.3 Validacoes de publicacao ligadas a links

Na hora de publicar, o sistema valida:

- existencia de pelo menos um link interno para o mesmo silo
- afiliado com `rel=sponsored`
- densidade de ancora
- repeticao excessiva de ancora

### 10.4 Camada antiga vs camada atual

Camada antiga:

- `post_links`
- `/admin/silos/[slug]/links`
- parte das validacoes simples

Camada atual:

- `post_link_occurrences`
- `link_audits`
- `silo_audits`
- `SiloLinkGraph`
- `LinkHygienePanel`

## 11. Integracoes externas

### 11.1 Contentor / importacao

Arquivos principais:

- `lib/editor/contentorImport.ts`
- `docs/contentor-wp-adapter.md`

O sistema:

- converte HTML importado para doc Tiptap
- preserva CTA, tabela, imagem e tokens internos
- expoe endpoints tipo WordPress para publicar via Contentor

### 11.2 Supabase

Guias existentes:

- `docs/DB_SETUP.md`
- `docs/SUPABASE_CLONE_PLAYBOOK.md`

### 11.3 SERP / Google

APIs e utilitarios:

- `app/api/serp/route.ts`
- `app/api/admin/serp/route.ts`
- `app/api/seo/cse/route.ts`
- `lib/googleCSE/search.ts`
- `lib/cache/serpCache.ts`

## 12. Fluxos operacionais recomendados

### 12.1 Criar e publicar um post

1. Abrir `/admin/editor/new`
2. Definir titulo, slug e keyword principal
3. Escrever ou importar conteudo
4. Ajustar links internos, termos, revisao e E-E-A-T
5. Definir silo, papel, grupo e ordem
6. Rodar revisao manual
7. Publicar

### 12.2 Organizar um silo

1. Abrir `/admin/silos/[slug]`
2. Ajustar metadados do silo
3. Confirmar grupos editoriais
4. Revisar papel/numero dos posts no editor
5. Revisar visao geral, grafo e canibalizacao

### 12.3 Revisar links internos

1. Abrir post no editor
2. Rodar `Links Internos IA`
3. Conferir `Links do artigo`
4. Salvar
5. Revisar o painel do silo

## 13. Achados da revisao

### 13.1 Achado critico: home ainda nao e CareGlow

`app/page.tsx` e o `README.md` ainda descrevem um projeto antigo de bebe/mobilidade. Isso conflita com:

- branding atual `CareGlow`
- silos atuais de skincare
- dominio `careglow.com.br`

Impacto: a camada publica principal ainda nao representa o projeto atual.

### 13.2 Achado critico: hubs fisicos estao sombreando o hub dinamico

Os 8 silos existem como rotas fisicas em `app/<slug>/page.tsx` e renderizam `SiloHub`, um placeholder estatico. Ao mesmo tempo existe `app/[silo]/page.tsx`, que implementa o hub dinamico real.

Como o App Router prioriza rota fisica, os 8 hubs atuais nao estao lendo posts do banco.

Impacto: a estrategia de hub/pilar/suportes do banco pode estar invisivel no front dos silos principais.

### 13.3 Achado medio: hierarquia esta duplicada

A hierarquia do silo aparece em dois lugares:

- colunas de `posts`
- tabela `silo_posts`

O save sincroniza, mas isso aumenta risco de divergencia em scripts, seeds e manutencao manual.

### 13.4 Achado medio: existe um mapa de silo legado

`/admin/silos/[slug]/map` usa componentes antigos (`components/silo/*`) e chama `/api/silos/{id}/audit`, rota que nao aparece no codigo atual.

Impacto: esse painel parece experimental/legado e nao deve ser tratado como fonte principal do sistema.

### 13.5 Achado medio: coexistem duas geracoes de sistema de links

O projeto ainda usa ao mesmo tempo:

- `post_links` e telas antigas
- `post_link_occurrences` / `link_audits` / `silo_audits` e telas novas

Impacto: quem mantiver o projeto precisa saber qual painel usa qual tabela.

## 14. O que esta ativo e o que parece legado

### Ativo e central

- `app/admin/editor/[postId]/page.tsx`
- `components/editor/*`
- `app/admin/silos/[slug]/page.tsx`
- `components/silos/*`
- `app/[silo]/[slug]/page.tsx`
- `app/api/admin/internal-link-suggestions/route.ts`
- `lib/silo/siloService.ts`

### Ativo, mas com sinais de transicao

- `app/[silo]/page.tsx`
- `post_links` coexistindo com `post_link_occurrences`
- importacao Contentor + renderizacao hibrida JSON/HTML

### Legado ou parcialmente deslocado

- `app/page.tsx` atual
- `README.md` atual
- `components/silo/*`
- `/admin/silos/[slug]/map`
- `/admin/silos/[slug]/links`

## 15. Documentos relacionados

- `docs/editor-responsive-modes.md`
- `docs/contentor-wp-adapter.md`
- `docs/DB_SETUP.md`
- `docs/SUPABASE_CLONE_PLAYBOOK.md`

## 16. Leitura curta para onboarding

Se alguem cair no projeto hoje e precisar entender rapido:

1. Leia este arquivo.
2. Leia `docs/editor-responsive-modes.md`.
3. Abra `components/editor/AdvancedEditor.tsx`.
4. Abra `app/admin/editor/actions.ts`.
5. Abra `app/admin/silos/[slug]/page.tsx`.
6. Abra `app/[silo]/[slug]/page.tsx`.

Esses arquivos explicam quase toda a operacao real do site.
