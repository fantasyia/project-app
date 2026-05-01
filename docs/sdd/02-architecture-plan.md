# FantasyIA - Architecture Plan

## 1. Stack Atual
- Next.js 16 App Router
- React 19
- Tailwind CSS 4
- Supabase SSR/Auth/Storage
- PostgreSQL
- Drizzle ORM

## 2. Estado Atual Observado No Repositorio

### Ja Existe
- grupos de rotas para publico, auth e dashboards;
- middleware de sessao e RBAC basico por `user_metadata.role`;
- dashboards iniciais para `subscriber`, `creator`, `admin`, `affiliate`, `writer/blog`;
- actions server-side para auth, posts, social, admin, afiliados, blog, checkout e notificacoes;
- schema Drizzle/migrations com `users`, `posts`, `likes`, `comments`, `follows`, `favorites`, `blog_articles`, `creator_profiles`, `wallets`, `subscription_plans`, `subscriptions`, `ppv_unlocks`, `chats`, `chat_messages` e `affiliate_commissions`;
- layout mobile restrito para subscriber com `BottomNav`;
- pagina publica `/pricing`, checkout placeholder, planos do creator e centro de notificacoes ja existem no app.

### Ainda Esta Em Estado Legado Ou Parcial
- branding visual do codigo ainda usa paleta dourada e `Inter`;
- schema principal usa `access_tier` simples (`free`/`premium`);
- integracao real de pagamentos ainda nao existe; actions e IDs `stripe_*` seguem como placeholder;
- faltam `billing_interval`, historico de renovacao, `payments` e `financial_ledger`;
- notificacoes estao no app, mas nao aparecem na modelagem local documentada;
- blog do app local ja avancou, mas a estrutura publica de rotas esta ambigua entre `[silo]` e `[slug]`;
- papel `writer` ainda existe no codigo como heranca tecnica.

## 3. Arquitetura Alvo

### 3.1 Camadas
1. `Contexto de produto`
   Fonte de verdade: `project-plaintext-context`
2. `Planejamento SDD`
   Fonte de continuidade: `docs/sdd/*`
3. `Dominio e schema`
   Entidades canonicas e migracoes
4. `Actions / data access`
   Server Actions e queries
5. `RBAC / guards`
   Middleware + validacoes no backend
6. `Interface`
   Publico vs privado com design system unificado

### 3.2 Separacao De Dominios

#### Dominio Principal Do App Privado
Inclui:
- creator profiles;
- relationships;
- subscriptions;
- payments;
- tips;
- PPV/unlocks;
- chats;
- affiliate commissions;
- wallets/ledger.

#### Dominio Editorial / Blog
Inclui:
- silos;
- posts editoriais;
- Tiptap/editor;
- SEO auditing;
- rotas publicas do blog;
- backend editorial desktop-first.

Regra:
- blog nao substitui modelagem do app privado;
- app privado nao deve absorver tabelas editoriais sem necessidade.

## 4. Arquitetura De Interface Alvo

### Publico
- full-width responsivo permitido;
- dark-only;
- mobile-first;
- editorial/cinematico;
- conversao e descoberta.

### Subscriber App
- container mobile (`max-w-md`) em desktop;
- bottom nav;
- fluxos verticais;
- chat central;
- sem sidebar.
- a copy user-facing nao deve expor `subscriber` como rotulo de produto; usar termos como `Conta`, `Area privada` ou contexto funcional da tela.
- a rota publica canonica do app logado do usuario deve ser `/dashboard/user`; `subscriber` permanece apenas como termo de dominio tecnico/RBAC e alias legado.

### Creator/Admin/Affiliate
- dark app;
- mobile-first;
- mais densidade funcional;
- sidebars e tabelas so quando fizer sentido operacional.
- `creator` pode manter shell hibrido, mas deve continuar com comportamento mobile-first e evitar visual de backoffice desktop como padrao principal.

### Blog Editor
- unica excecao desktop-first;
- ainda dark;
- segue arquitetura Multi-Silo.

## 5. Arquitetura De Dados Alvo

### Entidades Principais Esperadas
- `creator_profiles`
- `subscription_plans`
- `subscriptions`
- `subscription_renewals`
- `payments`
- `ppv_items`
- `content_unlocks`
- `chats`
- `chat_messages`
- `message_campaigns`
- `tips`
- `wallets`
- `financial_ledger`
- `affiliate_commissions`
- `refunds`
- `chargeback_cases`

### Entidades De Relacionamento E Conteudo
- `follows`
- `favorites`
- `bookmarks`
- `collections`
- `stories`
- `post_media`
- `reports`
- `moderation_actions`
- `audit_logs`
- `notifications`

### Legado Atual Que Precisa De Estrategia
- `access_tier`
- `writer`
- `blog_articles`

## 6. Estrategia De Evolucao

### Fase A - Alinhamento
- consolidar skills e docs SDD;
- fixar branding e regras de design como fonte de verdade;
- mapear legado vs alvo.

### Fase B - Plataforma Core
- fortalecer RBAC alem de `user_metadata.role`;
- definir schema alvo do dominio principal;
- planejar migracao final de `access_tier`.

### Fase C - UI Foundation
- migrar tokens visuais para a paleta oficial;
- remover dependencia visual da fase dourada/Inter;
- alinhar layouts publico/privado ao contexto.

### Fase D - Entitlements E Monetizacao
- subscriptions;
- PPV;
- trial;
- unlocks;
- payments/ledger.

### Fase E - Chat Comercial
- sustentar `chats` + `chat_messages`;
- suportar midia paga, automacoes e campanhas.

### Fase F - Portais Operacionais
- Creator Studio;
- Admin CRM;
- Affiliate Portal.

### Fase G - Blog Canonico
- integrar o preset Multi-Silo como modulo editorial alvo;
- separar claramente blog publico do app privado.

### Fase H - Notificacoes E Engajamento
- consolidar eventos, schema e taxonomia de notificacoes;
- expandir loops de engajamento e reativacao.

## 7. Decisoes Ja Fechadas
- dark mode only;
- mobile-first em quase todo o ecossistema;
- unica excecao desktop-first: backend editorial do blog;
- chat e canal comercial;
- blog usa arquitetura Multi-Silo;
- subscriber app nao usa sidebar;
- PPV e assinatura sao conceitos separados;
- checkout real e API do gateway ficam para o pre-lancamento; ate la a fronteira oficial e placeholder/mock nas server actions.

## 8. Decisoes Tecnicas Em Aberto
- estrategia de transicao de `access_tier` -> visibilidade/entitlement canonico;
- como representar `creator_profiles` versus `users` no schema local sem quebrar o que ja existe;
- como modelar `billing_interval`, renovacoes e `payments` sem acoplar cedo demais ao gateway final;
- como versionar `notifications` no schema local e nos eventos auditaveis;
- consolidacao final da taxonomia publica do blog para eliminar o conflito entre `[silo]` e `[slug]`;
- contrato final do provedor de pagamento, webhooks e status mapping no pre-lancamento;
- timing da troca de branding/tokens visuais no codigo atual;
- sincronizacao entre schema remoto real do Supabase e schema local em Drizzle.

## 9. Regra Pratica Para Novas Features
Nenhuma feature que toque monetizacao, acesso, chat ou schema deve ser implementada diretamente na UI sem antes definir:
- entidade;
- regra;
- impacto em RBAC;
- impacto em migracao;
- aceitacao minima.
