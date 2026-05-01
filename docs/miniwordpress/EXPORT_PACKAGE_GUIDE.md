# Export Package Guide

Este documento define como criar um ZIP ou repositorio neutro do Mini WordPress.

O pacote neutro serve principalmente para projetos novos. Em projetos existentes, o caminho mais seguro e aplicar por checklist e skills, porque o site/app da marca ja tem codigo proprio.

## Objetivo

Gerar um pacote que contenha:

- Core do Mini WordPress.
- Frontend Template reutilizavel.
- Migrations canonicas.
- Scripts de verificacao.
- Documentacao.
- Exemplos de Brand Adapter.

Sem conter:

- Dados fixos da CareGlow.
- Imagens proprietarias da marca.
- Slugs/menus exclusivos da CareGlow como padrao Core.
- Prompts hardcoded de nicho.
- Chaves, tokens ou credenciais.

## Estrutura sugerida do pacote

```text
miniwordpress/
  app/
    admin/
    api/admin/
    wp-json/
  components/
    admin/
    editor/
    silos/
    site-template/
  lib/
    miniwordpress/
    brands/
      example-brand/
  styles/
    miniwordpress/
    brands/
      example-brand.css
  supabase/
    migrations/
  scripts/
  docs/
    miniwordpress/
  .agents/
    skills/
  package.json
  README.md
```

## O que extrair do repo atual

### Core

- Admin layout e rotas.
- Editor.
- APIs administrativas.
- Sistema de silos.
- Sistema de links.
- Contentor adapter.
- Scripts de Supabase.
- Migrations canonicas.
- Classes admin.

### Template

- Menu publico de duas linhas.
- Estrutura de indice do artigo.
- Estrutura de footer.
- Template de pagina de post.
- Template de pagina de silo/hub.

### Brand Example

CareGlow deve virar exemplo, nao padrao.

Mover para algo como:

```text
lib/brands/careglow/
styles/brands/careglow.css
seed/brands/careglow/
```

## Brand Adapter minimo

Todo projeto novo deve preencher:

```ts
export const brandConfig = {
  key: "example",
  name: "Example Brand",
  domain: "example.com",
  logo: "/brand/logo.webp",
  language: "pt-BR",
  niche: "...",
  theme: {
    colors: {},
    fonts: {},
  },
  editorial: {
    authorName: "...",
    tone: [],
    affiliateDisclosure: "...",
  },
  silos: [],
  aiProfile: {},
};
```

## Checklist de neutralizacao

- `package.json` nao pode se chamar CareGlow.
- `README.md` raiz deve explicar Mini WordPress.
- `lib/site.ts` nao pode conter CareGlow como padrao Core.
- `components/site/SiteHeader.tsx` nao pode ter logo hardcoded.
- `components/site/HomeExpandedNav.tsx` nao pode ter silos hardcoded.
- Prompts em APIs nao podem citar CareGlow.
- Seeds CareGlow devem ir para exemplo.
- Imagens publicas da CareGlow devem sair do Core.
- Docs antigas devem apontar para `docs/miniwordpress`.

## Export manual

1. Criar branch ou copia limpa.
2. Rodar `npm install` ou equivalente.
3. Rodar verificacoes.
4. Mover configuracoes CareGlow para `lib/brands/careglow`.
5. Criar `lib/brands/example`.
6. Consolidar styles.
7. Consolidar migrations.
8. Atualizar docs.
9. Remover `.env.local`.
10. Gerar ZIP.

## Verificacoes obrigatorias

Comandos sugeridos:

```powershell
npm.cmd run build
npm.cmd run supabase:verify
npm.cmd run test
```

Se o projeto usar pnpm:

```powershell
corepack pnpm build
```

## Aplicacao em projeto novo

1. Copiar pacote.
2. Instalar dependencias.
3. Criar Supabase.
4. Rodar migrations.
5. Configurar `.env.local`.
6. Criar Brand Adapter.
7. Seedar silos.
8. Rodar dev server.
9. Validar admin.
10. Validar frontend publico.

## Aplicacao em projeto existente

1. Fazer raio-x do repo alvo.
2. Identificar rotas e estilos existentes.
3. Definir onde o admin vai viver.
4. Integrar banco sem quebrar tabelas existentes.
5. Isolar frontend template.
6. Criar Brand Adapter.
7. Migrar silos.
8. Validar build.

## Riscos

- Conflito de rotas Next.js.
- Tailwind global afetando site existente.
- Supabase com tabelas parecidas mas schema diferente.
- Prompts trazendo tom errado para o nicho.
- Menu publico quebrando em marcas com muitos silos.
- Conteudo publico recebendo dark mode do admin.

## Pendencias antes do primeiro ZIP oficial

- Separar Core/Brand em codigo.
- Criar brand example neutro.
- Consolidar migrations.
- Criar skills fisicos.
- Rodar build em copia limpa.
- Testar aplicacao em um projeto novo vazio.
