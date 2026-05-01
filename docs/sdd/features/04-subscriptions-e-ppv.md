# Feature Spec: Monetizacao (Subscriptions & PPV)

Use este template para qualquer nova feature ou refactor relevante.

## 1. Identificacao
- Nome da feature: Subscriptions e Pay-Per-View (PPV)
- Dominio:
  `plataforma-core` / `subscriber` / `creator`
- Status:
  `in_progress`

> Update 2026-04-20: a camada ativa de entitlement foi revisada. `active` e `trialing` podem liberar conteudo premium de assinatura quando o periodo ainda esta valido, mas PPV continua sendo avaliado antes da assinatura e exige registro explicito em `ppv_unlocks`.

## 2. Problema
- O que esta faltando? O banco de dados atualmente mapeia niveis de acesso simples (`access_tier`), mas nao a relacao de transacao recorrente (assinaturas) e os desbloqueios individuais de conteudo premium (PPV).
- Por que isso importa para o produto? O modelo de negocios da FantasyIA baseia-se diretamente na monetizacao atraves de assinaturas e vendas unitarias (conteudo bloqueado/DM). Sem um schema canonico, a monetizacao legada gera inconsistencias e dificulta a implementacao de carteiras (wallets) e do split de afiliados.

## 3. Usuarios Afetados
- Quem usa? `subscriber` (assina / compra PPV).
- Quem opera? `creator` (define precos e planos).
- Quem administra? `admin` (supervisiona chargebacks e metricas).

## 4. Escopo Funcional
- O que a feature faz?
  - Estabelece as tabelas de planos de assinatura.
  - Estabelece a tabela de controle de assinaturas ativas e historicas.
  - Estabelece a tabela de destranca de midias/mensagens por PPV.
  - Integra a estrutura inicial ao Drizzle e lanca a migracao.
- O que explicitamente nao faz?
  - Nao implementara as chamadas diretas a API REST do Stripe/Gateway financeiro nesta fase (foco no core schema).

## 5. Regras De Negocio
- `user` nao e igual a `creator`: logo, `subscriptions` ligam `users` a `creator_profiles`.
- `ppv unlock` nao e igual a assinatura: quem assina o creator nao ganha automaticamente um unlock de um PPV "high-ticket" ou de um chat privado monetizado, a menos que o creator deseje.
- `content visibility` depende de `entitlement` real: o sistema deve ler se a row ativa na tabela de `subscriptions` esta "active" no momento da requisicao, em vez de ler uma flag booleana de `users`.
- `trialing` segue a mesma regra de assinatura para conteudo premium nao-PPV, mas nunca desbloqueia PPV.
- PPV deve ser checado antes de assinatura/trial em qualquer render server-side.

## 6. Impacto Em Dados / Schema
- Tabelas novas: `subscription_plans`, `subscriptions`, `ppv_unlocks`, `financial_transactions` (opcional/ledger base).
- Tabelas alteradas: Aposentadoria logica da string hardcoded em `users` de acessos legados.
- Enums/status: `subscription_status` (`active`, `past_due`, `canceled`, `trialing`). `transaction_status` (`pending`, `completed`, `failed`).
- Historico/auditoria: O ledger e o status manterao historico puro imutavel.
- Legado afetado: `access_tier` gradualmente preterido pela abstracao de *Entitlement*.

## 7. Impacto Em RBAC
- Quais roles podem acessar? Creators criam planos de sua autoria. Subscribers assinam.
- Quais acoes sao sensiveis? Mudancas de status de assinatura; criacoes de unlocks manuais no PPV.
- Middleware basta ou precisa validacao adicional no backend? *Acoes severas de DB!* Precisara de decorators nas actions (como `requireRole('creator')`).

## 8. Impacto Em UI
- E frontend publico ou privado? Privado primariamente.
- Regras de layout: Mobile-first. Dark mode only.
- Regras de mobile-first: Cards de checkout limpos.
- Navegacao esperada: Superficie do usuario em `/dashboard/user/*`, checkout dedicado em `/checkout/[planId]` e operacao do creator em `/dashboard/creator/monetization`.

## 9. Architecture Delta
- O que muda na arquitetura atual? Nova centralizacao de transacoes no banco.
- Isso cria novo modulo, fluxo ou dependencia? Sim, modulo `entitlement` e `checkout`.
- Existe migracao de legado? Transformar quaisquer usuarios `premium` marcados arbitrariamente em lines forjadas e provisorias em `subscriptions` para nao quebrar acesso temporario.

## 10. Acceptance Criteria
- [ ] Schema `subscription_plans` expandido.
- [ ] Schema `subscriptions` amarrando usuario > plano.
- [ ] Schema `ppv_unlocks` permitindo destrancar post/mensagem.
- [ ] Migracoes Drizzle geradas perfeitamente e deployadas no banco via SQL.
- [x] Helper server-side central respeitando precedencia PPV > assinatura/trial.
- [x] Feed e perfil publico usando assinatura/trial apenas com periodo valido.

## 11. Task Breakdown
- [ ] Planejar dominio
- [ ] Ajustar schema/migracao
- [ ] Ajustar queries/actions
- [ ] Ajustar RBAC
- [ ] Ajustar UI
- [x] Validar fluxo de paywall SSR ativo em feed, perfil publico e checkout PPV.
- [ ] Atualizar docs SDD

## 12. Skills Recomendados
- `project-plaintext-context`
- `fantasyia-domain-schema`
