# FantasyIA

Aplicação Next.js do ecossistema FantasyIA.

## Antes De Codar
Leia nesta ordem:
1. `.agents/skills/project-plaintext-context/SKILL.md`
2. `docs/sdd/README.md`
3. `docs/sdd/01-product-prd.md`
4. `docs/sdd/02-architecture-plan.md`
5. `docs/sdd/03-task-breakdown.md`
6. `docs/sdd/04-skill-map.md`

## O Que Este Repositório Está Organizando
- contexto canônico do produto;
- workflow Spec Driven Development;
- mapa de skills do projeto;
- arquitetura alvo do app;
- backlog técnico por fases;
- base Next.js/Supabase/Drizzle/Tailwind do produto.

## Stack
- Next.js 16
- React 19
- Tailwind CSS 4
- Supabase
- PostgreSQL
- Drizzle ORM

## Rodando Localmente
```bash
npm run dev
```

## Observação Importante
O código atual ainda contém partes legadas de branding, schema e nomenclatura.
Quando houver conflito entre código antigo e documentação atual, seguir a ordem de prioridade definida em `docs/sdd/README.md` e no `project-plaintext-context`.
