# FantasyIA — Skill Map

Este mapa organiza os skills por papel dentro do projeto.

## 1. Skills Canônicos Do Projeto

| Skill | Papel no projeto | Quando usar | Observação |
|---|---|---|---|
| `project-plaintext-context` | Fonte de verdade do produto | Sempre que mexer em regras, domínio, schema, acesso ou arquitetura | Skill-base do projeto |
| `frontend-design` | Fonte de verdade visual do FantasyIA | Telas, componentes, layouts, UX e design system | Já alinhado a dark-only, mobile-first e paleta oficial |
| `fantasyia-sdd-delivery` | Orquestrador de desenvolvimento SDD | Planejamento, continuidade, backlog, sequência de implementação | Novo skill de workflow |
| `fantasyia-domain-schema` | Modelagem de domínio/schema do app | Banco, migrações, enums, relações e legado vs alvo | Novo skill de domínio |
| `fantasyia-stitch-alignment` | Ponte entre Stitch e o projeto | Qualquer uso de Stitch ou conversão visual | Novo skill de alinhamento |

## 2. Skills Técnicos De Apoio

| Skill | Papel | Uso correto no FantasyIA |
|---|---|---|
| `supabase-postgres-best-practices` | Performance/modelagem Postgres | Usar Parte 1 para Postgres em geral e Parte 2 para blog/editorial Multi-Silo |
| `blog-architecture` | Preset canônico do blog | Apenas para blog/editorial público e backend do Redator |
| `tailwind-css-patterns` | Apoio utilitário Tailwind | Sempre subordinado a `frontend-design` e ao contexto do projeto |
| `vercel-react-best-practices` | Performance React/Next | Para implementação/refatoração de componentes e páginas |
| `vercel-composition-patterns` | Arquitetura de componentes | Para evitar props booleanas e melhorar composição |
| `skill-creator` | Criar/otimizar novos skills | Quando um padrão do projeto merecer virar skill novo |

## 3. Coleção Stitch (`stitch-skills-main`)

Esses skills existem como biblioteca de apoio, mas precisam de override do projeto.

| Skill / Pasta | Uso | Regra no FantasyIA |
|---|---|---|
| `stitch-design` | Geração/edição visual via Stitch | Usar junto com `fantasyia-stitch-alignment` |
| `design-md` | Gerar DESIGN.md a partir do Stitch | Usar junto com `frontend-design` |
| `taste-design` | Refinar linguagem visual do Stitch | Só depois de aplicar as regras do FantasyIA |
| `react-components` | Converter Stitch para React | Não assumir Vite/`App.tsx`; adaptar para Next.js App Router |
| `stitch-loop` | Loop autônomo de construção | Não usar sem checar se faz sentido para a arquitetura real do repo |
| `shadcn-ui` | Componentes/blocos de referência | Só como referência, nunca como identidade visual automática |

## 4. Regras De Uso Combinado

### Qualquer tarefa de produto
- `project-plaintext-context`
- `fantasyia-sdd-delivery`

### Qualquer tarefa de UI
- `project-plaintext-context`
- `frontend-design`
- `tailwind-css-patterns` se necessário

### Qualquer tarefa de schema
- `project-plaintext-context`
- `fantasyia-domain-schema`
- `supabase-postgres-best-practices`

### Blog / editorial
- `project-plaintext-context`
- `blog-architecture`
- `supabase-postgres-best-practices`
- `frontend-design` se houver UI

### Qualquer tarefa com Stitch
- `project-plaintext-context`
- `frontend-design`
- `fantasyia-stitch-alignment`
- skill específico dentro de `stitch-skills-main`

## 5. Skills Que Hoje Podem Confundir Se Usados Isoladamente
- `tailwind-css-patterns`
  Motivo: exemplos genéricos/light.
  Mitigação: usar com os overrides do FantasyIA.

- `supabase-postgres-best-practices`
  Motivo: Parte 2 é específica do blog, não do app privado inteiro.
  Mitigação: combinar com `fantasyia-domain-schema`.

- `stitch-skills-main/react-components`
  Motivo: assume Vite/`App.tsx`/mockData genérico.
  Mitigação: usar apenas com `fantasyia-stitch-alignment`.

- `blog-architecture`
  Motivo: é canônico para blog, mas não para subscriber/chat/monetização.
  Mitigação: manter separado do domínio principal.
