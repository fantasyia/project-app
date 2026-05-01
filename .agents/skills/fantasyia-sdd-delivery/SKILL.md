---
name: fantasyia-sdd-delivery
description: |
  Orquestra o desenvolvimento Spec Driven Development do FantasyIA.
  Use este skill sempre que a tarefa envolver planejamento, continuidade do app,
  criação ou atualização de PRD, architecture plan, task breakdown, alinhamento
  entre skills, definição de escopo de uma feature, organização de backlog, ou
  escolha da sequência correta de implementação. Este skill conecta contexto,
  skills técnicos e documentação SDD para evitar perda de contexto.
---

# FantasyIA SDD Delivery Workflow

Este skill define como desenvolver o FantasyIA sem perder contexto, sem misturar domínios e sem pular decisões importantes.

## Fontes De Verdade
Ler nesta ordem:
1. `../project-plaintext-context/SKILL.md`
2. `../../../docs/sdd/04-skill-map.md`
3. `../../../docs/sdd/01-product-prd.md`
4. `../../../docs/sdd/02-architecture-plan.md`
5. `../../../docs/sdd/03-task-breakdown.md`

Se houver conflito:
- regras de negócio e domínio: `project-plaintext-context`;
- prioridade e escopo: `01-product-prd.md`;
- desenho técnico: `02-architecture-plan.md`;
- ordem de execução: `03-task-breakdown.md`.

## Quando Usar
Use este skill quando a tarefa envolver:
- iniciar uma nova feature;
- continuar uma feature já começada;
- reorganizar backlog;
- decidir a ordem de implementação;
- alinhar skills com o projeto;
- criar documentação de continuidade;
- revisar se uma tarefa está pronta para implementação.

## Fluxo SDD Obrigatório

### Passo 1: Classificar a Feature
Classifique a tarefa em um destes domínios:
- `publico`;
- `subscriber`;
- `creator`;
- `admin`;
- `affiliate`;
- `blog-editorial`;
- `plataforma-core`.

### Passo 2: Definir O Artefato
Toda feature deve ter, no mínimo:
- escopo funcional;
- regras de negócio;
- impacto em dados/schema;
- impacto em RBAC;
- impacto em UI público/privado;
- critérios de aceite.

Se a feature ainda não tiver isso, crie ou atualize o artefato usando `../../../docs/sdd/templates/feature-spec-template.md`.

### Passo 3: Escolher Os Skills Certos
Use sempre o mínimo conjunto de skills que cobre a tarefa:
- contexto do projeto: `project-plaintext-context`;
- frontend/interface: `frontend-design`;
- Tailwind utilitário: `tailwind-css-patterns`;
- modelagem Postgres/Supabase: `supabase-postgres-best-practices`;
- blog Multi-Silo: `blog-architecture`;
- React/Next performance: `vercel-react-best-practices`;
- composição de componentes: `vercel-composition-patterns`;
- Stitch/geração visual: `../fantasyia-stitch-alignment/SKILL.md`.

Não deixar skills genéricos sobrescreverem regras do FantasyIA.

### Passo 4: Planejar Na Ordem Certa
A sequência padrão de implementação é:
1. domínio e regras;
2. schema e migrações;
3. queries/server actions;
4. RBAC e guards;
5. layout e componentes;
6. fluxos de tela;
7. validação;
8. atualização dos documentos SDD.

### Passo 5: Fechar O Loop
Ao terminar uma tarefa:
- marcar o progresso no `03-task-breakdown.md`;
- atualizar o `02-architecture-plan.md` se a arquitetura mudar;
- atualizar o template/feature spec se a decisão mudou;
- registrar novas convenções que mereçam virar contexto recorrente.

## Regras De Segurança De Escopo
- não pular direto para UI se a feature mexe em acesso, monetização ou schema;
- não misturar modelagem do blog com modelagem do app privado;
- não inventar termos novos se o contexto já define o nome canônico;
- não expandir `messages` legado quando a decisão alvo já for `chats` + `chat_messages`;
- não tratar implementação legada como fonte de verdade se o projeto já redefiniu a regra.

## Resultado Esperado
Cada feature do FantasyIA deve conseguir responder claramente:
- o que é;
- para quem é;
- onde vive no produto;
- quais regras governa;
- quais tabelas toca;
- quais skills usar;
- em que ordem implementar.
