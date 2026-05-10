# FantasyIA

Aplicacao Next.js do ecossistema FantasyIA.

## Antes De Codar
Leia nesta ordem:
1. `.agents/skills/project-plaintext-context/SKILL.md`
2. `docs/sdd/README.md`
3. `docs/sdd/10-raio-x-2026-05-09.md`
4. `docs/sdd/01-product-prd.md`
5. `docs/sdd/02-architecture-plan.md`
6. `docs/sdd/03-task-breakdown.md`
7. `docs/sdd/04-skill-map.md`

## Regras Rapidas
- Produto dark-only, mobile-first e app-like.
- Tablet vertical precisa ser responsivo.
- Em paisagem/horizontal, nao mostrar aviso bloqueante de orientacao; manter o frame vertical como best-effort.
- `Navegar como` e exclusivo de admin e fica separado do menu local.
- Plano gratuito user-facing chama `Plano Basico`, nunca Gratis/free/livre.
- Premium, Esmeralda e PPV sao por creator.
- Admin Midia usa revisao por select: recomendar, advertir creator ou remover midia.
- Gateway real, webhooks, conciliacao financeira e email real de moderacao ficam fora do escopo ate pre-lancamento.

## O Que Este Repositorio Organiza
- contexto canonico do produto;
- workflow Spec Driven Development;
- mapa de skills do projeto;
- arquitetura alvo do app;
- backlog tecnico por fases;
- base Next.js/Supabase/Drizzle/Tailwind do produto.

## Stack Atual
- Next.js 15 App Router
- React 19
- Tailwind CSS 4
- Supabase Auth/SSR/Storage/Postgres
- Drizzle ORM

## Rodando Localmente No Windows
```bash
npm.cmd run dev
```

## Observacao Importante
O codigo ainda pode conter partes legadas de branding, schema e nomenclatura. Quando houver conflito entre codigo antigo e documentacao atual, seguir a prioridade definida em `docs/sdd/README.md` e `.agents/skills/project-plaintext-context/SKILL.md`.

Alguns recursos implementados no codigo dependem de migracoes aplicadas no Supabase remoto. Se aparecer erro de schema cache em comentarios, likes, notificacoes ou Admin Midia, verificar primeiro as migracoes recentes em `supabase/migrations`.
