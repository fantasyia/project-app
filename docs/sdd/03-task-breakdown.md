# FantasyIA - Task Breakdown (Fase Atual: Product Completeness)

Status usados:
- `done`
- `in_progress`
- `next`
- `later`
- `blocked`

## VISAO GERAL (Fim da Fundacao Tecnica)
A "Fase 1: SDD Execution" (estrutura, roteamento, permissoes, schema de banco e fluxos transacionais base) foi **100% concluida**.
O proximo agente deve focar na "Fase 2: Product Completeness" - construir as UIs funcionais definitivas e mobile-first, conectando os motores que ja estao prontos no backend e banco de dados.

### Revisao De Aderencia Ao Plano (2026-04-16)
- `done` Auditar PRD, architecture plan, task breakdown e implementacao real para medir aderencia da Fase 2 ao plano original.
- `done` Confirmar que os desvios atuais estao concentrados em UI/copy user-facing e consistencia mobile-first, nao mais em arquitetura, schema base ou roteamento estrutural.
- `done` Corrigir vazamento de nomenclatura interna na UI do assinante (`Subscriber App`, `Conta do assinante`, pseudo-status `Mobile-first`) para linguagem mais adequada ao usuario final.
- `done` Reaproximar `/pricing` e o shell do Creator Studio do comportamento mobile-first esperado pelo PRD.
- `done` Canonizar `/dashboard/user` como rota publica principal do app logado, mantendo `/dashboard/subscriber` apenas como alias legado de compatibilidade.

### Revisao tecnica feita antes da Fase 2
- `done` Corrigir redirect legado do papel `editor` para a rota canonica `/dashboard/blog`.
- `done` Corrigir o fluxo de unlock PPV para respeitar os nomes de coluna reais do schema (`amount_paid`, `stripe_payment_intent_id`).
- `done` Ajustar a logica de acesso para que posts PPV continuem bloqueados mesmo quando o `access_tier` local ainda esta em transicao.
- `done` Unificar o alias legado `/dashboard/writer/*` para o backend editorial canonico em `/dashboard/blog/*`.

### Revisao De Isolamento De Areas (2026-04-23)
- `done` Tornar o RBAC estrito por papel: `subscriber`, `creator`, `affiliate` e `editor` nao compartilham mais areas privadas entre si; apenas `admin` acessa tudo.
- `done` Passar a resolver role efetiva pela tabela `users` (fonte canonica), com fallback no metadata apenas quando necessario.
- `done` Corrigir o caso de creator sem permissao de postagem por divergencia entre metadata e role persistida no banco.
- `done` Corrigir perfil do creator com upload real de avatar (arquivo), validacao de handle e revalidacao da pagina publica.
- `done` Adicionar edicao de perfil do usuario em `/dashboard/user/account/edit` (nome, bio, avatar), separando o fluxo operacional de user do fluxo de creator.

### Revisao De Independencia De Identidade (2026-04-23)
- `done` Criar migracao `0007_identity_context_split.sql` para separar identidade de `subscriber` (`subscriber_profiles`) e identidade publica de `creator` (`creator_profiles.public_*`), com backfill inicial e indices.
- `done` Finalizar `getCurrentUser(context)` para contexto explicito por area (`creator`, `subscriber`, `affiliate`), evitando vazamento visual de avatar/nome/handle entre apps.
- `done` Atualizar telas privadas para contexto explicito: Creator Studio (`studio/messages/profile/settings`) e app do usuario (`account/account-edit/messages`).
- `done` Atualizar consumo de identidade publica do creator em rotas criticas: perfil publico `/(public)/[handle]`, feed/busca, checkout e conversas.
- `done` Canonizar links internos do app do usuario para `/dashboard/user/*`; `/dashboard/subscriber/*` fica como alias legado via middleware.
- `done` Restringir assinatura e unlock PPV a conta `subscriber` nas server actions, com resposta amigavel quando a role nao for permitida.
- `done` Manter fallback seguro para schema legado (sem quebrar app enquanto migracao nao foi aplicada no banco remoto).
- `next` Aplicar a migracao `0007_identity_context_split.sql` no ambiente remoto para ativar a independencia total sem fallback.
- `next` Rodar QA manual com duas contas (creator + user) validando troca de avatar/nome/handle em cada area sem contaminacao cruzada.

### Revisao Funcional De Perfil Publico E Notificacoes (2026-04-24)
- `done` Corrigir o runtime de realtime em notificacoes do usuario, evitando reutilizar canal Supabase depois de `subscribe()` em montagens repetidas do React.
- `done` Corrigir a query do perfil publico do creator para usar `likes(user_id)` em vez de coluna inexistente `likes(id)`, restaurando a listagem real de posts no perfil publico.
- `done` Ler o catalogo publico do creator com service role server-side para que `/[handle]` consiga renderizar posts publicos/locked mesmo com RLS do visitante anonimo.
- `done` Adicionar fallback de identidade publica via `auth.user_metadata.creator_profile` enquanto o banco remoto ainda nao tem as colunas novas de `creator_profiles.public_*`.
- `done` Remover o campo interno "Tipo de conta" da tela de configuracoes do creator e parar de expor "Admin" como label publico do header.
- `done` Trocar a navegacao do Creator Studio de trilho horizontal com overflow para menu hamburger/dropdown mobile-first.
- `done` Gerar notificacoes locais para curtidas e comentarios em posts do creator.
- `done` Tornar o perfil `/(public)/[handle]` visivel apenas para usuario logado, sem CTA publico de painel no topo.
- `done` Adicionar banner visual de apresentacao no perfil do creator, usando midia do catalogo/avatar como fallback ate existir campo dedicado de capa.
- `done` Adicionar acoes diretas no perfil do creator para seguir e abrir direct com o influencer, mantendo assinatura/PPV como camada separada de acesso ao conteudo.
- `done` Ajustar acesso do grid do creator: post livre abre para usuario logado, premium depende de assinatura/trial valido e PPV depende de unlock explicito.
- `blocked` A independencia total sem fallback ainda depende de aplicar a migracao `0007_identity_context_split.sql` no Supabase remoto.

### Revisao De Cadastro E Convites (2026-04-25)
- `done` Remover a escolha publica de tipo de conta no cadastro: signup comum agora sempre cria `subscriber/user`.
- `done` Adicionar entrada/cadastro com Google OAuth, tambem com perfil default `subscriber/user`.
- `done` Adicionar gerador de links de convite no Admin CRM para `creator`, `affiliate`, `editor/blog` e `subscriber/user`, sem opcao de convite publico para `admin`.
- `done` Validar role privilegiada no signup apenas por token de convite assinado; sem token valido, qualquer tentativa cai em `subscriber`.
- `done` Manter links de convite sem tabela remota nova, usando assinatura HMAC com expiracao para nao bloquear no estado atual do Supabase.
- `done` Adicionar recuperacao de senha por email com `/forgot-password`, callback Supabase e tela `/reset-password`.
- `done` Endurecer isolamento de areas privadas: admin, creator, affiliate, editor e user/subscriber nao navegam entre dashboards uns dos outros.
- `done` Adicionar selecao de area ativa apos login para contas privilegiadas: admin pode escolher Admin, Creator, Afiliado, Blog ou User; roles convidadas podem escolher a propria area ou User.
- `done` Adicionar menu hamburger "Navegar como" apenas para conta base `admin`, permitindo alternar area ativa sem misturar dashboards.
- `done` Confirmar que o menu "Navegar como" nao aparece para `user/subscriber`, `affiliate`, `creator` ou `editor`; apenas contas base `admin` podem alternar entre areas.
- `done` Persistir area ativa em cookie de sessao (`fantasyia_active_role`), mantendo a role base no banco e usando a area ativa para RBAC/middleware.

## 1. Planejamento E Contexto (Fase de Fundacao: Completa)
- `done` Consolidar `project-plaintext-context` como fonte de verdade do dominio.
- `done` Alinhar `frontend-design` com dark mode, mobile-first e paleta oficial.
- `done` Criar skill de workflow SDD do projeto.
- `done` Arquitetura base do banco e schema resolvidas local e remoto (Supabase).

## 2. Fase de Produto (Product Completeness) - CONCLUIDA NO ESCOPO LOCAL

### 2.1 O CMS do Blog Completo (Top Prioridade)
- `done` Implantar a UI avancada de CMS editorial em `/dashboard/blog/create` com Guardiao SEO, Outline H2/H3, Blocos Dinamicos e preview tecnico do payload.
- `done` Criar fluxo real de continuidade em `/dashboard/blog/[articleId]/edit`, com selecao de silo, grupos editoriais e update seguro com fallback de schema.
- `done` Mapear revalidacao publica do blog e dos hubs `/blog/s/[silo]`, incluindo renderizacao publica melhor do conteudo serializado.
- `done` Trocar a serializacao markdown/blocos por um Rich Text Editor definitivo baseado em Tiptap, mantendo SEO, cover, silos e compatibilidade de leitura com conteudo legado.

### 2.2 Creator Studio (O Flow Principal)
- `done` Criar o "Composer" (criador de posts focado em midia - `/dashboard/creator/posts/create`).
- `done` Ligar Toggles de Monetizacao no upload (Gratis, Premium via Assinatura, PPV avulso).
- `done` Garantir upload real para o Supabase Storage.
- `done` Refinar o painel do Creator Studio com snapshot operacional de wallet, recorrencia, PPV, mix do catalogo e unlocks recentes.
- `done` Melhorar a biblioteca `/dashboard/creator/posts` com badges reais de monetizacao e preview visual do catalogo.
- `done` Substituir o shell lateral desktop por cabecalho + navegacao horizontal mais app-like, reduzindo a sensacao de backoffice tradicional.
- `done` Revisar as superfices auxiliares iniciais de `/dashboard/creator/plans` e `/dashboard/creator/followers` para uma composicao mais mobile-first e menos administrativa.
- `done` Revisar `creator/notifications`, `creator/profile` e `creator/settings` para uma leitura mobile-first mais coerente com o Studio.
- `done` Revisar `creator/messages` para operar como inbox comercial do Studio, com snapshot proprio e enquadramento mais premium do chat canonico.
- `done` Fechar o polish fino entre `creator/messages`, `creator/plans` e `creator/posts`, com navegacao ativa no shell e biblioteca de conteudo reescrita na mesma linguagem de cockpit operacional.
- `done` Travar `/dashboard/creator/studio` em leitura mobile-first tambem no desktop (shell e cockpit centralizados em largura de app), sem voltar para grade desktop larga.

### 2.3 Simulacao de Checkout e UX Financeira
- `done` Tornar a UX de transacao local perfeita mesmo com os "mocks" de pagamento atuais, com checkout premium funcional para assinatura e rota dedicada de unlock PPV.
- `done` Revisar `/pricing` para alinhar a landing de planos ao comportamento mobile-first, mantendo os placeholders financeiros apenas como demo de pre-lancamento.
- `done` Expandir os eventos financeiros locais: assinatura e PPV agora tentam registrar `payments`, `financial_ledger`, taxa da plataforma e saldo de wallet do creator com fallback seguro quando o schema remoto ainda nao tiver todas as tabelas.
- `done` Enriquecer o historico financeiro do usuario com assinaturas, unlocks PPV de post/chat e gorjetas no mesmo feed de eventos.
- `done` Atualizar o Creator Studio com leitura de ledger local, creditos, taxas, liquido e eventos financeiros recentes.
- `done` Fechar mobile-first estrito do frontend publico principal (`/`, `/pricing`, blog publico e checkouts), mantendo o unico desktop-first permitido em `/dashboard/blog`.
- `later` (Pre-Lancamento): Integrar gateway real (Stripe/Pagar.me) e substituir `mockSubscribe`/`mockUnlockPpv`.

## 3. Auth, Roles E Seguranca
- `done` Oficializar "editor" como papel canonico de app: cadastro/login e filtros admin ja trabalham em role normalizada; aliases legados (`writer`/`blog`) seguem apenas para compatibilidade de metadata e enum antigo no banco.
- `done` Validar edge cases de paywall SSR nos caminhos ativos de feed/perfil/checkout: PPV continua exigindo unlock explicito antes de qualquer assinatura/trial, e assinatura/trial so libera conteudo premium nao-PPV dentro do periodo valido.
- `done` Mapear trials/cupons/descontos como backlog financeiro futuro em spec propria, sem misturar trial com PPV.

## 4. O App do Assinante
- `done` Home Feed com blur nos Paywalls, Chat Realtime com creators.
- `done` Bookmarks, Stories viewer e Purchase History.
- `done` Review agressivo de front-end Mobile-First no app do usuario, incluindo travamento de comportamento mobile no chat/feed mesmo em viewport desktop e nova rodada de QA visual real.
- `done` Primeira passada estrutural no shell do assinante e nas telas `search`, `bookmarks`, `purchases` e `account`, junto da limpeza de lint que bloqueava o trilho do subscriber app.
- `done` Segunda passada visual em `feed`, `notifications`, `BottomNav` e entrada de `messages`, consolidando hierarquia premium e navegacao com cara de app nativo.
- `done` Terceira passada funcional no subscriber app: notificacoes com lista e contagem em realtime, chat com envio otimista + reconciliacao de leitura e CTA de PPV do feed apontando para `/checkout/ppv/[postId]`.
- `done` Quarta passada funcional no subscriber app: filtros de conversa no chat, composer de gorjeta conectado ao backend local (`sendTip` + comprovante na thread) e refinamento do feed para explicitar a origem do acesso (`livre`, `assinatura`, `PPV liberado`).
- `done` Quinta passada de aderencia ao plano: remover copy interna desnecessaria do assinante e revisar a conta/layout para uma linguagem mais orientada a usuario final.
- `done` Sexta passada de aderencia ao plano: trocar a superficie publica de `subscriber` para `user`, alinhar redirects, links internos, revalidacoes e docs do handoff com essa convencao.
- `done` Setima passada funcional no app do usuario: fechar midia paga real no chat com upload ao Storage, unlock dentro da thread, lista de compras cobrindo unlocks de chat e realtime preparado para estado `locked/unlocked/owner`.
- `done` Oitava passada de polish do app do usuario: filtros mais profundos no chat, favoritos persistidos localmente, busca na fila de conversas e estados vazios mais premium em `/dashboard/user/messages`.
- `done` Nona passada de polish do app do usuario: refinamento final de continuidade visual em `feed`, `account`, `BottomNav`, sino de notificacoes e shell mobile.

## 4.1 Admin CRM
- `done` Primeira passada mobile-first no Admin CRM: shell sem sidebar em qualquer viewport, largura de app mobile centralizada, overview refeito como cockpit operacional e usuarios em cards mobile-only.
- `done` KYC, moderacao, reembolsos e chargebacks revisados para cards operacionais mobile-first, estados vazios premium e copy menos burocratica.
- `done` Financeiro e ajustes receberam estados placeholder mais alinhados ao dominio, deixando claro que gateway real, campanhas e conciliacao ficam para pre-lancamento/futuro.

## 4.2 Affiliate Portal
- `done` Primeira passada mobile-first no Affiliate Portal: shell sem sidebar em qualquer viewport, largura de app mobile centralizada e navegacao horizontal mobile-only.
- `done` `overview`, `links`, `commissions`, `promoted` e `settings` revisados para cards verticais e leitura de app mobile.
- `done` Remocao de tabela ampla e de variacoes desktop no modulo de afiliados.

## 4.3 QA Visual Em Navegador Real
- `done` Setup Playwright com `chromium-desktop` e `chromium-mobile`, servidor local automatico e scripts de execucao em `package.json`.
- `done` Smoke visual real em rotas publicas e privadas com captura de screenshot por rota.
- `done` Execucao concluida com `16 passed`; evidencias em `test-results` e `playwright-report`.

## 5. Ordem Recomendada Para o Proximo Agente
1. Leia as Fases listadas aqui e o `project-plaintext-context`.
2. Considerar a Fase 2 encerrada e abrir apenas frentes de pre-lancamento financeiro/comercial.
3. Manter `.agents/skills` fora do lint de produto; limpar exemplos ali apenas se houver uma tarefa especifica de tooling.
4. Priorizar gateway real, trial/cupom/desconto e conciliacao financeira homologada em trilha separada.

## 6. Estado Atual Consolidado (2026-04-17)
- Fase atual: `Fase 2: Product Completeness`.
- Blog CMS: concluido e operacional com editor rico, silos, SEO e renderizacao publica.
- Creator Studio: composer real, upload real e monetizacao base concluidos; `plans`, `followers`, `notifications`, `profile`, `settings`, `messages` e `posts` agora compartilham a mesma linguagem visual operacional, com shell de navegacao ativa e continuidade maior entre inbox, planos e catalogo.
- Checkout/PPV: jornadas locais funcionais prontas; `/pricing` foi revisado para uma composicao mais mobile-first; assinatura, PPV e gorjetas agora alimentam historico financeiro local, ledger/wallet do creator quando o schema suporta essas tabelas; paywall SSR foi revisado para impedir que assinatura/trial libere PPV; trials/cupons/descontos foram separados em spec futura.
- Rotas publicas/checkout: home publica, pricing, blog publico (lista, hub e artigo), perfil publico do creator e checkouts de assinatura/PPV estao em composicao mobile-first, com QA visual validando publico + privado.
- Subscriber App: shell, feed, notificacoes realtime, chat otimista, gorjetas, midia paga no chat com unlock na thread, bookmarks, purchases, account, favoritos locais no chat, busca de conversas, estados vazios premium e continuidade visual geral estao implementados.
- Admin CRM: primeira passada mobile-first concluida em shell mobile-only, overview, usuarios, KYC, moderacao, reembolsos, chargebacks, financeiro e ajustes.
- Affiliate Portal: primeira passada mobile-first concluida em shell mobile-only, overview, links, comissoes, promovidos e ajustes.
- QA Visual Real: Playwright configurado e executado com sucesso em publico + privado, desktop + mobile.
- QA Visual Real (rodada final): reexecutado apos hardening mobile-first com `16 passed`.
- Roteamento do usuario: `/dashboard/user` agora e a rota publica canonica; `/dashboard/subscriber` fica apenas como alias legado para compatibilidade.
- Papel editorial: `editor` esta canonizado no app; `/dashboard/writer` e tratada como rota legado com redirecionamento imediato para `/dashboard/blog`.
- Lint/typecheck global: `npx tsc --noEmit --pretty false` sem erros; `npm run lint` sem erros e com 8 warnings residuais antigos no creator app. `.agents/**` fica excluido do lint de produto por ser contexto/tooling de agentes.

## 7. Decisoes Presas / Bloqueadas Propositalmente
- `blocked` Stripe/Integracao de pagamento final (esperando liberacao de valores).
- `blocked` Deploy Completo Vercel Prod (pendente UI estar 100% pronta e dados simulados testados).
