# Feature Spec Template

Use este template para qualquer nova feature ou refactor relevante.

## 1. Identificação
- Nome da feature:
- Domínio:
  `publico` / `subscriber` / `creator` / `admin` / `affiliate` / `blog-editorial` / `plataforma-core`
- Status:
  `draft` / `approved` / `in_progress` / `done`

## 2. Problema
- O que está faltando?
- Por que isso importa para o produto?

## 3. Usuários Afetados
- Quem usa?
- Quem opera?
- Quem administra?

## 4. Escopo Funcional
- O que a feature faz?
- O que explicitamente não faz?

## 5. Regras De Negócio
- Quais regras do `project-plaintext-context` governam essa feature?
- Existe impacto em assinatura, trial, PPV, relacionamento ou visibilidade?
- Existe impacto em blog/editorial?

## 6. Impacto Em Dados / Schema
- Tabelas novas:
- Tabelas alteradas:
- Enums/status:
- Histórico/auditoria:
- Legado afetado:

## 7. Impacto Em RBAC
- Quais roles podem acessar?
- Quais ações são sensíveis?
- Middleware basta ou precisa validação adicional no backend?

## 8. Impacto Em UI
- É frontend público ou privado?
- Regras de layout:
- Regras de mobile-first:
- Navegação esperada:
- Estados vazios/erro/loading:

## 9. Architecture Delta
- O que muda na arquitetura atual?
- Isso cria novo módulo, fluxo ou dependência?
- Existe migração de legado?

## 10. Acceptance Criteria
- [ ] Critério 1
- [ ] Critério 2
- [ ] Critério 3

## 11. Task Breakdown
- [ ] Planejar domínio
- [ ] Ajustar schema/migração
- [ ] Ajustar queries/actions
- [ ] Ajustar RBAC
- [ ] Ajustar UI
- [ ] Validar fluxo
- [ ] Atualizar docs SDD

## 12. Skills Recomendados
- `project-plaintext-context`
- `fantasyia-sdd-delivery`
- adicionar aqui os skills específicos da feature
