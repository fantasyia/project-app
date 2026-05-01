# Feature Spec: 03 Schema Alvo Core

Use este template para qualquer nova feature ou refactor relevante.

## 1. Identificação
- Nome da feature: Evolução Canônica do Schema Principal
- Domínio:
  `plataforma-core`
- Status:
  `approved`

## 2. Problema
- O que está faltando? Tabelas centrais que viabilizam o modelo de negócio base. Faltam `creator_profiles`, estrutura de transações (`wallets`) e os hooks estruturais que preparam para subscriptions e tip. A tabela de assinaturas precisa abandonar colunas flat no `users` limitadas como `access_tier` = free/premium.
- Por que isso importa para o produto? É a fundação do Produto de Conteúdo Fechado + Carteiras (+ PPV). Sem isso, o banco de dados não suporta o produto.

## 3. Usuários Afetados
- Quem usa? Plataforma inteira (Base de dados do Supabase via Drizzle).

## 4. Escopo Funcional
- O que a feature faz? Cria a migration e define schema (em TypeScript pelo Drizzle) contendo: `creator_profiles`. Define a transição de `access_tier`.
- O que explicitamente não faz? Não escreve os endpoints do Stripe nem lógicas de faturamento/carrinho (Isso é Feature 04 e adiante).

## 5. Regras De Negócio
- Quais regras do `project-plaintext-context` governam essa feature? Criadores têm perfis operacionais separados das contas de Assinantes. Assinantes enxergam Creators. Visibilidade depende do `entitlement` real ao invés de booleanos flat.

## 6. Impacto Em Dados / Schema
- Tabelas novas: `creator_profiles`, `wallets` (base), relatórios de auditoria/moderação stub.
- Tabelas alteradas: `users` (remoção da dependência única de fields legados).
- Legado afetado: `messages` intocado nesta sprint, `access_tier` abandonado/marcado para exclusão.

## 7. Impacto Em UI
- Múltiplas quebras esperadas nas queries atuais, que devem ser corrigidas na mesma transação desta feature.

## 8. Architecture Delta
- Migração de database oficial e central via Drizzle local para Supabase remoto.

## 9. Acceptance Criteria
- [ ] Schema do Drizzle (`src/db/schema.ts`) foi estendido as tabelas listadas.
- [ ] Migration gerada e aplicada com sucesso.
- [ ] Nenhuma quebra crítica nas telas antigas após mapeamento atualizado no DB.

## 10. Task Breakdown
- [ ] Desenhar o delta do Entity Relationship e migrar para `schema.ts`.
- [ ] Corrigir referências a queries quebradas pelo Drizzle.
- [ ] Aplicar no DB em ambiente local de dev.
- [ ] Validar sincronia com banco.

## 11. Skills Recomendados
- `fantasyia-domain-schema`
- `supabase-postgres-best-practices`
