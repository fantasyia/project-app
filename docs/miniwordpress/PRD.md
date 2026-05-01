# Mini WordPress PRD

Status: draft canonico inicial  
Base atual: `skincare-affiliate-blog-main` / CareGlow  
Data: 2026-04-28

## 1. Visao

Mini WordPress e um sistema de blog editorial reutilizavel para criar, organizar, otimizar e publicar artigos em projetos de nicho.

Ele deve funcionar como um produto transplantavel: pode ser aplicado em projetos novos ou em projetos existentes sem sequestrar a identidade da marca, sem quebrar o app/site principal e sem depender de conhecimento escondido de um agente anterior.

O sistema atual nasceu dentro da CareGlow, mas o destino e virar uma base neutra para marcas como Lindisse, Bebe na Rota, Adalba Pro, FantasyIA e novos projetos.

## 2. Problema

Hoje o repositorio mistura quatro coisas:

- Mini WordPress Core: admin, editor, IA, SEO, silos, Supabase, Contentor adapter.
- CareGlow Brand: nome, dominio, textos institucionais, fontes, imagens, cores publicas, seeds de skincare.
- Frontend Template: estruturas reutilizaveis do blog, menu, rodape, indice e paginas de silo.
- Legacy / transicao: docs antigas, migrations duplicadas/soltas, skills CareGlow e arquivos ainda sem dono claro.

Essa mistura dificulta copiar o sistema para outra marca, porque cada clone carrega partes da CareGlow e exige que o agente descubra manualmente o que pode ou nao pode mudar.

## 3. Objetivos

1. Documentar o Mini WordPress como sistema produto.
2. Separar Core, Brand Adapter, Frontend Template e Legacy.
3. Criar um caminho repetivel para instalar o sistema em novos projetos.
4. Criar um caminho seguro para adaptar o sistema em projetos existentes.
5. Registrar banco, migrations, scripts, rotas, APIs, layout, prompts, SEO, silos e integracoes.
6. Preparar uma base para skills de agentes.
7. Preparar, depois da documentacao, um ZIP/repositorio neutro.

## 4. Nao objetivos nesta fase

- Nao criar ainda o ZIP neutro.
- Nao mover migrations sem auditoria adicional.
- Nao remover CareGlow do produto publico nesta etapa.
- Nao reescrever o frontend publico antes de registrar o contrato Core/Brand/Template.
- Nao rodar clone Supabase real sem credenciais de destino.

## 5. Modelo do produto

### 5.1 Core

Core e tudo que pertence ao Mini WordPress e deve viajar para qualquer projeto.

Inclui:

- Admin privado em `/admin`.
- Login/admin session.
- Painel de conteudos.
- Painel de silos.
- Editor Tiptap.
- Painel esquerdo de inteligencia do artigo.
- Painel direito de metadados, SEO, revisao, E-E-A-T e publicacao.
- Busca no artigo.
- Termos / LSI IA.
- Linkagem interna e Link Hygiene IA.
- Guardian SEO.
- Revisao manual, plagio, duplicacao interna e SERP.
- Upload/midia.
- WordPress-like REST adapter para Contentor.
- Supabase schema, migrations e seed estrutural.
- Scripts de clone/verificacao.
- Regras de dark mode e densidade do admin.
- APIs administrativas e de SEO.

### 5.2 Brand Adapter

Brand Adapter e tudo que muda por marca/nicho.

Inclui:

- Nome da marca.
- Dominio.
- Logo.
- Cores publicas.
- Fontes publicas.
- Tom editorial.
- Nicho.
- Autores/personas.
- Disclaimer de afiliados.
- Prompts por nicho.
- Silos iniciais.
- Seeds de posts e grupos.
- Imagens publicas.
- Textos institucionais.

Regra: Brand Adapter pode afetar o frontend publico e o conteudo do artigo. Nao pode alterar o comportamento estrutural do Core sem decisao explicita.

### 5.3 Frontend Template

Frontend Template sao estruturas publicas reutilizaveis que fazem parte da identidade funcional do Mini WordPress, mas devem receber estilo da marca.

Inclui:

- Menu publico com duas linhas de silos.
- Home com busca e navegacao por silos.
- Pagina de silo/hub.
- Pagina de post.
- Indice/table of contents.
- Rodape estrutural.
- Componentes de card/lista/carrossel quando usados como estrutura editorial.

Regra: o template define estrutura, responsividade e comportamento. A marca define cores, fonte, imagem, hover e acabamento visual.

### 5.4 Legacy / Transicao

Legacy e tudo que existe no repositorio atual, mas ainda nao esta pronto para ser exportado como Core ou Template.

Inclui:

- Docs duplicadas ou CareGlow-specific.
- Pasta `.agent` com skills antigas de CareGlow.
- Pasta `migrations/` solta fora de `supabase/migrations`.
- Seeds CareGlow.
- Rotas publicas hardcoded por slug.
- Componentes com nomes CareGlow.
- `package.json` com nome CareGlow.
- Assets publicos que pertencem a outra marca ou teste.

## 6. Regra principal de isolamento

O Mini WordPress deve ser escuro, denso, legivel e independente da marca no admin.

A area do artigo no editor, especialmente `.editor-public-preview`, pertence a marca. Cores, fontes e estilos do conteudo do artigo devem vir da marca ou do template publico, nao do admin.

## 7. Admin Mini WordPress

### Requisitos

- Sempre dark mode.
- Fonte propria do sistema, nao fonte da marca.
- Painel denso, profissional e confortavel.
- Evitar "Bento Box" excessivo.
- Campos raros devem ficar recolhidos.
- Slugs devem ser altamente legiveis.
- Titulos de paineis em caixa alta.
- Cores com contraste claro.
- Nenhuma classe light-mode solta deve quebrar legibilidade no admin.

### Areas principais

- `/admin`: conteudo em operacao.
- `/admin/silos`: listagem de silos.
- `/admin/silos/[slug]`: metadados, visao geral, mapa de links, canibalizacao, SERP.
- `/admin/editor/[postId]`: editor completo.
- `/admin/preview/[postId]`: preview privado.

## 8. Editor

### Requisitos

- Tiptap e extensoes customizadas.
- Toolbar fixa/densa.
- Painel esquerdo de inteligencia.
- Painel direito de metadados e revisao.
- Area central do artigo preserva visual da marca.
- Ferramenta "Buscar no Artigo" no topo.
- Termos / LSI IA no final.
- Analise SERP do Post na aba Revisao.

### Painel esquerdo

Ordem canonica atual:

1. Buscar no Artigo.
2. Estrutura H2/H3/H4.
3. Links internos IA.
4. Link Hygiene.
5. Guardian SEO.
6. Termos / LSI IA.

### Termos / LSI IA

Deve permitir:

- Monitorar termos e entidades.
- Adicionar contexto de SEO local.
- Adicionar fontes de autoridade.
- Inserir palavras-chave e receber sinonimos/relacoes harmonicas ao contexto do artigo.
- Inserir sugestoes no cursor.

## 9. IA e prompts

O sistema deve ter um espaco documentado para prompts adaptaveis por nicho.

Categorias de prompt:

- Guardian SEO.
- Melhorar trecho.
- Linkagem interna.
- Link Hygiene.
- Termos / LSI.
- Entidades e fontes.
- SERP.
- E-E-A-T.
- Prompt de marca/nicho.

Cada prompt deve separar:

- Instrucao fixa do Core.
- Variaveis de marca.
- Variaveis de nicho.
- Variaveis do artigo.
- Criterios de aceitacao.
- Formato JSON esperado quando houver API.

## 10. SEO e Silos

Mini WordPress deve tratar o blog como arquitetura de silos.

Requisitos:

- Cada post pertence a um silo quando aplicavel.
- Silo pode ter pilar e suportes.
- Slug deve ser visivel e usado como identificador operacional.
- Linkagem interna deve favorecer relacoes organicas.
- IA pode sugerir microajustes de frase para encaixar links naturais.
- Canibalizacao deve comparar intencao e SERP.
- Auditoria de saude do silo deve indicar orfaos, inbound/outbound e pendencias.

## 11. Frontend Template canonico

### Menu de 2 linhas

O menu publico da home e um elemento marcante do Mini WordPress.

Estrutura:

- Logo acima ou alinhado conforme marca.
- Busca publica.
- Botao `Inicio` ocupando duas linhas na esquerda.
- Silos no centro em duas linhas.
- Links institucionais comuns (`Sobre`, `Contato`) na direita.

Contrato:

- Estrutura pertence ao Template.
- Lista de silos vem do sistema/brand adapter.
- Cores, bordas, fonte e hover pertencem a marca.
- Mobile deve preservar acesso simples aos silos, mesmo que mude para menu recolhido.

Arquivos atuais relacionados:

- `components/site/HomeExpandedNav.tsx`
- `components/site/SiteHeader.tsx`
- `app/globals.css` classes `system-silo-nav-*`

Problema atual:

- `HomeExpandedNav.tsx` ainda tem silos hardcoded de CareGlow.
- `SiteHeader.tsx` usa logo hardcoded de Bebe na Rota.
- Isso deve virar configuracao de Brand Adapter.

## 12. Banco de dados e Supabase

Fonte pretendida:

- `supabase/migrations` deve ser a fonte principal de migrations.
- `supabase/schema.sql` deve ser snapshot auxiliar, nao substituir migrations.
- `supabase/seed.json` deve ser separado em seed core e seed brand.

Estado atual:

- Existe `docs/SUPABASE_CLONE_PLAYBOOK.md`.
- Existe script `scripts/clone-supabase.ts`.
- Existe script `scripts/verify-supabase.ts`.
- Existe pasta `migrations/` fora de `supabase/migrations`, que precisa ser classificada.

Pendencias:

- Validar se `SUPABASE_CLONE_PLAYBOOK.md` funciona em Windows.
- Registrar fallback `npm.cmd`/`corepack pnpm` quando `pnpm` puro nao estiver disponivel.
- Separar seed Core de seed CareGlow.
- Classificar migrations soltas como legacy, duplicadas ou pendentes.

## 13. Contentor

O sistema expoe endpoints estilo WordPress para o Contentor.

Arquivos atuais:

- `docs/contentor-wp-adapter.md`
- `app/wp-json/wp/v2/posts/route.ts`
- `app/wp-json/wp/v2/media/route.ts`
- `app/wp-json/wp/v2/users/me/route.ts`
- `app/api/admin/wp-app-password/route.ts`
- `cloudflared.exe` no root

Requisitos de documentacao:

- Explicar quando usar cloudflared local.
- Explicar URL local/publica do Contentor.
- Explicar credenciais WP fake e application password.
- Explicar que imports entram como draft.

## 14. Skills planejados

Pasta alvo recomendada:

- `.agents/skills/`

Estado atual:

- Existe `.agent/skills/`, singular.
- Skills atuais sao CareGlow-specific ou layout wizard antigo.

Skills necessarios:

1. `miniwordpress-supabase`
2. `miniwordpress-repository-map`
3. `miniwordpress-admin-layout`
4. `miniwordpress-tailwind4`
5. `miniwordpress-contentor`
6. `miniwordpress-ai-prompts`
7. `miniwordpress-editor`
8. `miniwordpress-silos-seo`
9. `miniwordpress-brand-adapter`
10. `miniwordpress-frontend-template`
11. `miniwordpress-export-package`

Cada skill deve apontar para documentos em `docs/miniwordpress/` e nao repetir contexto grande sem necessidade.

## 15. Requisitos para ZIP/repositorio neutro

O ZIP neutro so deve ser criado depois de:

1. PRD estabilizado.
2. Repository audit completo.
3. Database playbook validado.
4. Brand Adapter definido.
5. Prompts organizados.
6. Frontend Template sem hardcode CareGlow.
7. README neutro.
8. Seeds separadas.
9. Skills criados.

O ZIP deve conter:

- Core.
- Frontend Template.
- Brand Adapter example.
- Scripts.
- Migrations organizadas.
- Docs canonicas.
- Checklist de instalacao.

## 16. Roadmap

### Fase 1: Raio-x e PRD

- Criar `docs/miniwordpress`.
- Criar PRD.
- Criar audit inicial Core / Brand / Template / Legacy.
- Registrar pendencias de docs, skills e migrations.

### Fase 2: Documentacao tecnica

- Architecture.
- Repository map.
- Database schema.
- Supabase clone playbook revisado.
- Contentor/cloudflared guide.
- Admin UI guide.
- Editor guide.
- Silos/SEO guide.
- AI prompts guide.
- Frontend template guide.
- Brand adapter guide.

### Fase 3: Skills

- Criar `.agents/skills`.
- Migrar ou arquivar `.agent/skills`.
- Criar skills por area.
- Cada skill deve ser pequeno, objetivo e apontar para docs canonicas.

### Fase 4: Refatoracao de isolamento

- Extrair configuracoes de marca para `brand adapter`.
- Remover hardcodes CareGlow do Core.
- Tornar menu de 2 linhas alimentado por silos/config.
- Separar seeds core/brand.
- Organizar migrations.

### Fase 5: Export neutro

- Criar repo/ZIP neutro.
- Criar checklist de instalacao.
- Testar em projeto novo.
- Testar em projeto existente.

## 17. Criterios de sucesso

Um agente novo deve conseguir:

1. Entender o que e Mini WordPress em menos de 15 minutos.
2. Identificar o que e Core e o que e marca.
3. Clonar banco Supabase sem adivinhar.
4. Rodar admin local.
5. Configurar Contentor.
6. Adaptar prompts para um nicho.
7. Preservar o menu de 2 linhas no frontend.
8. Implementar em outra marca sem trazer CareGlow por acidente.
