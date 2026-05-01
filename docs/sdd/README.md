# FantasyIA - Spec Driven Development Hub

Este diretorio concentra a camada de planejamento continuo do projeto.
O objetivo e manter o FantasyIA evoluindo sem perder contexto entre produto, arquitetura, skills e implementacao.

## Ordem De Leitura
1. [Product PRD](./01-product-prd.md)
2. [Architecture Plan](./02-architecture-plan.md)
3. [Task Breakdown](./03-task-breakdown.md)
4. [Skill Map](./04-skill-map.md)
5. [Status Report - 2026-04-16](./05-status-report-2026-04-16.md)
6. [Status Report - 2026-04-17](./06-status-report-2026-04-17.md)
7. [Status Report - 2026-04-20](./07-status-report-2026-04-20.md)
8. [QA Visual Report - 2026-04-20](./08-qa-visual-playwright-2026-04-20.md)
9. [Status Report - 2026-04-21](./09-status-report-2026-04-21.md)
10. [Feature Spec Template](./templates/feature-spec-template.md)

## Ordem De Prioridade
Se houver conflito entre os artefatos:
1. `.agents/skills/project-plaintext-context/SKILL.md`
2. `01-product-prd.md`
3. `02-architecture-plan.md`
4. `03-task-breakdown.md`
5. implementacao atual do codigo

Ou seja: codigo legado nao vence decisao ja fechada no contexto.

## Fluxo SDD Do Projeto
Use este fluxo para qualquer continuacao do app:

1. Classificar a feature em um dominio:
   `publico`, `subscriber`, `creator`, `admin`, `affiliate`, `blog-editorial` ou `plataforma-core`.
2. Validar se a feature ja esta coberta nestes docs.
3. Se nao estiver, criar ou atualizar um mini spec com base no template.
4. Selecionar os skills corretos antes de implementar.
5. Implementar na ordem:
   dominio -> schema -> actions -> RBAC -> UI -> validacao -> atualizacao dos docs.
6. Atualizar o `Task Breakdown` ao terminar ou destravar uma etapa.
7. Atualizar tambem o `Status Report` quando houver virada de fase, nova convencao canonica, grande revisao de aderencia ao plano ou handoff para outro agente. O relatorio mais recente passa a ser a referencia principal de continuidade.

## Objetivo
Responder sempre estas perguntas antes de codar:
- O que exatamente esta sendo construido?
- Onde essa feature vive no produto?
- Quais regras de negocio governam essa tela ou fluxo?
- Quais entidades/tabelas sao afetadas?
- Quais skills precisam ser combinados?
- O que ja existe e o que ainda falta?
