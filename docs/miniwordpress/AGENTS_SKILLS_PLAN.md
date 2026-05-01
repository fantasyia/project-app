# Agents and Skills Plan

Este documento define os skills e instrucoes para agentes implementarem o Mini WordPress sem perder contexto.

O objetivo e que humanos e agentes consigam instalar, adaptar, auditar e evoluir o sistema em qualquer projeto.

## Fonte canonica

Antes de qualquer skill executar trabalho, ele deve ler:

1. `docs/miniwordpress/README.md`
2. `docs/miniwordpress/PRD.md`
3. Documento especializado do assunto
4. `docs/miniwordpress/IMPLEMENTATION_CHECKLIST.md`

## Pasta recomendada

Usar `.agents/skills/` como pasta canonica.

Status atual:

- Existem sinais de `.agent/skills/` legado.
- A pasta precisa ser auditada antes de virar fonte oficial.
- Skills novos devem ir para `.agents/skills/miniwordpress-*`.

## Skills necessarios

### `miniwordpress-repo-map`

Funcao:

- Ler o repo alvo.
- Classificar arquivos como Core, Brand, Template ou Legacy.
- Gerar mapa de integracao.

Entradas:

- Caminho do repo.
- Nome da marca.
- Tipo de projeto: novo ou existente.

Saidas:

- Relatorio de colisao.
- Lista de arquivos Core.
- Lista de pontos Brand.
- Plano de migracao.

### `miniwordpress-supabase-clone`

Funcao:

- Preparar Supabase para Mini WordPress.
- Rodar ou orientar clone.
- Verificar tabelas e colunas.

Base:

- `docs/miniwordpress/DATABASE_SCHEMA.md`
- `docs/miniwordpress/SUPABASE_CLONE_PLAYBOOK.md`

Comandos relacionados:

- `npm run supabase:clone`
- `npm run supabase:verify`

### `miniwordpress-migrations`

Funcao:

- Auditar migrations.
- Diferenciar migrations canonicas de SQL legado.
- Criar plano de consolidacao.

Base:

- `docs/miniwordpress/MIGRATIONS_AUDIT.md`

### `miniwordpress-contentor`

Funcao:

- Configurar adapter WordPress/Contentor.
- Verificar `cloudflared.exe`.
- Testar rotas `wp-json`.
- Validar senha de app.

Base:

- `docs/miniwordpress/CONTENTOR_CLOUDFLARED.md`

### `miniwordpress-admin-ui`

Funcao:

- Aplicar dark mode administrativo.
- Corrigir leitura.
- Reduzir bento box.
- Garantir isolamento `.editor-public-preview`.

Base:

- `docs/miniwordpress/ADMIN_UI_SYSTEM.md`
- `docs/miniwordpress/TAILWIND4_SYSTEM.md`

### `miniwordpress-editor`

Funcao:

- Configurar editor.
- Validar paineis esquerdo/direito.
- Garantir ordem de ferramentas.
- Verificar aplicacao de sugestoes IA.

Base:

- `docs/miniwordpress/EDITOR_SYSTEM.md`

### `miniwordpress-silos-seo`

Funcao:

- Criar/adaptar silos.
- Configurar grupos editoriais.
- Validar menu publico.
- Auditar linkagem e canibalizacao.

Base:

- `docs/miniwordpress/SILOS_AND_SEO_SYSTEM.md`
- `docs/miniwordpress/FRONTEND_TEMPLATE.md`

### `miniwordpress-ai-prompts`

Funcao:

- Criar prompt pack da marca.
- Separar prompt Core de Brand Adapter.
- Ajustar nicho, tom, fontes e restricoes.

Base:

- `docs/miniwordpress/AI_PROMPTS_AND_BRAND_ADAPTER.md`
- `docs/miniwordpress/BRAND_ADAPTER_GUIDE.md`

### `miniwordpress-tailwind4`

Funcao:

- Auditar tokens e classes.
- Evitar mistura de admin e marca.
- Migrar estilos para arquivos separados quando necessario.

Base:

- `docs/miniwordpress/TAILWIND4_SYSTEM.md`

### `miniwordpress-export-package`

Funcao:

- Preparar ZIP/repo neutro.
- Remover dados CareGlow.
- Incluir docs e migrations canonicas.
- Validar install em projeto limpo.

Base:

- `docs/miniwordpress/EXPORT_PACKAGE_GUIDE.md`

## Regras para agentes

- Nunca misturar Core e Brand por conveniencia.
- Nunca alterar a area publica da marca ao corrigir o admin.
- Nunca remover migrations sem registrar motivo.
- Nunca converter prompt de nicho em prompt Core.
- Sempre validar com build ou verificacao equivalente quando houver codigo.
- Sempre atualizar docs quando descobrir divergencia.

## Ordem recomendada de execucao

Para projeto novo:

1. `miniwordpress-export-package`
2. `miniwordpress-supabase-clone`
3. `miniwordpress-brand-adapter`
4. `miniwordpress-silos-seo`
5. `miniwordpress-contentor`
6. `miniwordpress-admin-ui`
7. `miniwordpress-editor`
8. `miniwordpress-ai-prompts`

Para projeto existente:

1. `miniwordpress-repo-map`
2. `miniwordpress-brand-adapter`
3. `miniwordpress-supabase-clone`
4. `miniwordpress-admin-ui`
5. `miniwordpress-frontend-template`
6. `miniwordpress-silos-seo`
7. `miniwordpress-ai-prompts`
8. `miniwordpress-contentor`

## Pendencias

- Criar fisicamente os skills em `.agents/skills/`.
- Padronizar formato de `SKILL.md`.
- Remover ou arquivar `.agent/skills` antigo se confirmado legado.
- Criar exemplos por marca: CareGlow, Lindisse, Bebe na Rota, Adalba Pro, FantasyIA blog.
