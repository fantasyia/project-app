---
name: FantasyIA - My Secret Doll
description: |
  Contexto oficial do produto FantasyIA.
  Use este skill sempre que a tarefa envolver regras de negócio, arquitetura do domínio,
  interface mobile-first, RBAC, monetização, visibilidade de conteúdo, chat comercial,
  afiliados, schema de banco de dados, fluxo de assinaturas ou decisões estruturais
  da plataforma. Este documento deve ser tratado como fonte de verdade do projeto.
---

# FantasyIA - Project Context & Rules (Uma rede social artística privada premium)

## COMO USAR ESTE CONTEXTO
- Tratar este documento como fonte de verdade para regras de produto, modelagem do domínio e decisões de arquitetura.
- Os placeholders `[DATE]`, `[EMAIL]`, `[FantasyIA]` e `[fantasyia.com]` são intencionais e só serão preenchidos no lançamento.
- Para planejamento, priorização e continuidade do desenvolvimento, consultar também os artefatos em `../../../docs/sdd/`.
- Quando houver conflito entre interface, monetização e dados, seguir esta ordem de prioridade: segurança/RBAC -> relação usuário/creator -> assinatura -> visibilidade do conteúdo -> desbloqueio PPV.
- Não misturar conceitos diferentes na mesma tabela, no mesmo campo ou no mesmo enum.
- Sempre separar regra de negócio atual, backlog futuro e estado atual da implementação.

## PROPÓSITO DO PROJETO
Rede Social Artística Privada Premium. O nicho é visual artístico, fotografia e lifestyle.
O formato principal é o consumo rápido e imersivo em dispositivos móveis, com feed infinito, imagens em alta resolução, vídeos curtos, likes, comentários, stories, chat de mensagens diretas e monetização por assinatura, PPV, gorjetas e afiliados.
O produto não deve ser tratado como simples feed premium. O chat é um canal comercial central da plataforma.

## TERMINOLOGIA CANÔNICA DO DOMÍNIO
- `user`: conta autenticada da plataforma. Todo acesso começa por um `user`.
- `role`: papel de acesso do `user`. Os perfis previstos são `admin`, `creator`, `subscriber`, `affiliate` e `editor`.
- `creator`: canal/perfil público monetizável exibido ao assinante. É a entidade seguida, assinada, descoberta, favoritada e associada ao conteúdo.
- `creator role`: papel do usuário com acesso ao Creator Studio. No schema e nas regras de negócio, não confundir o operador autenticado com o canal público do creator.
- `subscriber`: `user` consumidor do conteúdo. Pode seguir creators, assinar creators, comprar PPV, enviar gorjetas e conversar via chat.
- `affiliate`: `user` ou parceiro com links rastreáveis, métricas de funil e comissões.
- `editor`: usuário interno responsável pelo blog e conteúdo público de topo de funil.
- `subscription_plan`: oferta comercial criada por creator, com preço, ciclo de cobrança e regras de renovação.
- `subscription`: contrato de assinatura entre subscriber e creator. É um objeto financeiro/comercial.
- `relationship state`: estado da relação do subscriber com um creator. Não é a mesma coisa que o status financeiro da assinatura.
- `content visibility`: regra editorial de acesso de um post ou mídia. Não é a mesma coisa que pagamento confirmado.
- `ppv unlock`: desbloqueio pago individual de conteúdo. Não deve ser modelado como assinatura.
- `chat`: conversa/thread entre participantes.
- `chat_message`: evento individual dentro de um chat. Mensagem e chat não devem ser a mesma entidade.
- `payment`: evento de cobrança.
- `payout`: repasse financeiro para creator ou afiliado.
- `wallet`: saldo operacional de uma conta financeira da plataforma.
- `financial_ledger`: razão financeira imutável. Deve ser a fonte de verdade para entradas, saídas, ajustes, gorjetas, comissões, reembolsos e chargebacks.

## PRINCÍPIOS DE MODELAGEM DE DADOS
- Não confundir autenticação com domínio de negócio. `users` representa contas autenticadas; regras comerciais e relacionamentos devem viver em tabelas normalizadas do domínio.
- Não confundir `creator` com `user`. Mesmo que parte da implementação atual esteja acoplada a `users`, o agente deve raciocinar como se existissem duas camadas conceituais: conta autenticada e canal público monetizável.
- `subscription status` e `relationship state` devem ser separados. A assinatura modela o contrato financeiro; a relação modela o estado social/permissivo entre subscriber e creator.
- `content visibility` e `entitlement` devem ser separados. A visibilidade diz quem pode ver; o entitlement confirma se aquele usuário realmente ganhou acesso.
- `ppv_locked` nunca deve ser resolvido apenas por assinatura ou trial. Se exige compra unitária, precisa de registro explícito de unlock.
- O modelo canônico de mensagens é `chats` + `chat_messages`. A tabela `messages`, se existir, deve ser tratada como legado técnico do estado atual.
- Histórico importante deve ter tabela própria. Não esconder renovação, unlock, cupom, payout, reembolso ou chargeback apenas em JSON.
- Estados finitos devem usar enums claros e auditáveis.
- Eventos sensíveis devem gerar trilha de auditoria.
- `user_metadata.role` pode ser usado no middleware para navegação e guarda de rotas, mas não deve ser a única fonte de verdade para relatórios, permissões financeiras ou histórico operacional.

## ARQUITETURA DE INTERFACE E ISOLAMENTO (MUITO IMPORTANTE)
O sistema possui 5 áreas completamente independentes em layout, permissões e funcionalidades:

1. **ÁREA DO ASSINANTE (O App Principal)**
- Layout estrito: 100% mobile-first. Se aberto no desktop, deve simular a tela de um celular (`max-w-md` centralizado).
- Navegação: bottom tab navigation (`Home/Feed`, `Buscar`, `Mensagens`, `Perfil`). Nunca usar sidebar.
- Funcionalidades principais: feed infinito, posts de foto/vídeo, like, comentário, salvar em coleção, favoritar creator, seguir creator, chat e histórico de compras.

Além do que já existe, incluir:
- feed global;
- stories;
- favoritar creator;
- lista de favoritos;
- posts fixados no topo do perfil;
- filtros por mídia: foto / vídeo / áudio;
- busca por creators, tags e categorias;
- bookmarks / coleções;
- sugestões de creators;
- creators relacionados;
- histórico de compras;
- histórico de conteúdos desbloqueados.

**PLANOS DE ASSINATURA**
A plataforma deve suportar planos de assinatura:
- mensal;
- trimestral;
- anual.

Cada plano deve possuir:
- preço;
- período de cobrança;
- data de início;
- data de vencimento;
- status;
- renovação automática;
- histórico de renovações.

2. **CREATOR STUDIO (Área do Operador do Creator - App Mobile)**
- Foco: upload de mídias, postagem de conteúdo, métricas financeiras e de engajamento, visão de assinantes e operação comercial do chat.
- O Studio é a área do papel `creator`, mas o objeto público consumido pelo assinante continua sendo o `creator` como canal/perfil monetizável.
- Pode ter layout híbrido mobile para facilitar upload de arquivos pesados, sem abandonar a lógica mobile-first.

O perfil público do creator precisa exibir:
- avatar;
- capa;
- bio;
- preço da assinatura;
- botão seguir;
- botão assinar;
- botão mandar mensagem;
- botão enviar gorjeta;
- indicadores de total de posts;
- indicadores de total de fotos;
- indicadores de total de vídeos;
- indicadores de likes/favoritos;
- posts fixados;
- destaques/stories;
- link de afiliado, se aplicável.

3. **ADMIN CRM (Painel de Controle Global - App Mobile)**
- Layout: ferramenta operacional mobile-first com aparência de app. Sidebar, tabelas, tabs, accordions e listas densas são permitidos quando forem realmente necessários para operação, desde que a usabilidade no celular continue válida.
- Foco: controle global da base, permissões, moderação, risco, antifraude, fluxo financeiro e cadastro operacional.

Além do que já existe, o admin precisa:
- aprovar/reprovar creators;
- revisar documentos/KYC;
- moderar mídias reportadas;
- moderar chats reportados;
- configurar taxas da plataforma;
- gerir cupons e campanhas globais;
- gerir categorias e tags;
- ver chargebacks e reembolsos;
- auditar logs sensíveis;
- configurar limites operacionais;
- gerir antifraude e detecção de abuso;
- gerir comissões de afiliados;
- ver métricas consolidadas da plataforma.

4. **AFFILIATE PORTAL (Área de Afiliados - App Mobile)**
- Foco: geração de links parametrizados, visualização de cliques, conversões e comissões. Dashboard de performance pura, ainda com lógica mobile-first.

O portal de afiliados deve conter:
- geração de link único;
- tracking por creator e por campanha;
- cookie de 14 dias;
- comissão inicial;
- comissão recorrente;
- painel de cliques;
- painel de conversões;
- painel de comissões;
- payout;
- status de comissão.

5. **REDATOR DE BLOG (Backend Editorial Desktop-first)**
- Foco: criar e postar artigos de moda e fotografia abertos ao público para SEO e topo de funil, utilizar como arquitetura do blog o "Blog Architecture Preset".
- Esta é a única área que pode ser desenhada prioritariamente como desktop-first.
- O backend editorial pode ser desktop-first, mas o frontend público do blog continua mobile-first.

## DIRETRIZ GLOBAL DE INTERFACE
Todo o ecossistema do FantasyIA deve ser projetado com interface mobile-first e experiência visual de app.

Isso significa:
- a Área do Assinante deve ser 100% pensada como aplicativo mobile;
- o Creator Studio também deve seguir interface mobile;
- o Admin CRM também deve seguir interface mobile;
- o Affiliate Portal também deve seguir interface mobile;
- o frontend público/blog também deve seguir interface mobile;
- a única exceção desktop-first é o backend editorial do Redator de Blog.

Regra de produto:
- mesmo quando acessado em desktop, o sistema deve priorizar layout, navegação e proporção visual de aplicativo mobile;
- evitar interfaces pesadas com cara de ERP tradicional sempre que isso puder ser resolvido com padrões de app;
- priorizar bottom navigation, cards, drawers, modais e fluxos verticais;
- tabelas muito amplas devem ser evitadas ou adaptadas para cards, accordions, tabs e listas mobile;
- telas administrativas podem ser densas, mas ainda precisam ser operáveis em celular.

Objetivo:
- manter consistência visual de app premium;
- facilitar operação mobile em todas as áreas;
- evitar quebra de experiência entre áreas do sistema.

## HOME / DESCOBERTA
A home da plataforma deve incluir:
- feed global para toda a plataforma, estilo Instagram;
- top 5 creators na home;
- stories por creator.

Regra inicial do top 5:
- critério estático por enquanto;
- no futuro, programar critério baseado no número de Secret Fans.

RODAPÉ DO SITE
Colocar no rodapé do site:
Terms | Privacy | Refund | DMCA | AI Disclaimer

## CHAT (CANAL COMERCIAL CENTRAL)
O chat deve ser tratado como canal de venda, não apenas conversa.
Deve suportar:
- texto;
- áudio;
- imagem;
- vídeo;
- GIF/emoji;
- mídia paga travada;
- venda de mídias avulsas dentro do chat;
- mensagem automática de boas-vindas;
- mensagem em massa;
- filtros de conversas;
- favoritos;
- reativação de expirados;
- solicitação de pagamento/gorjeta.

## DIRETRIZES DE SEGURANÇA DE MÍDIA
O sistema não deve prometer bloqueio absoluto de print ou captura de tela, pois isso não é tecnicamente garantível em web/app.

O sistema deve:
- dificultar salvar imagens e vídeos por meios diretos da interface;
- desabilitar interações simples de salvar quando possível;
- usar URLs protegidas e expiráveis para mídia;
- aplicar watermark dinâmica por usuário em conteúdos privados e pagos;
- registrar logs de acesso e consumo de mídia;
- usar compressão/transcoding e entrega protegida por CDN.

Objetivo:
- reduzir vazamento casual;
- aumentar rastreabilidade;
- dificultar redistribuição indevida.

## MONETIZAÇÃO
A plataforma deve suportar:
- assinatura mensal, trimestral e anual por creator;
- renovação automática da assinatura;
- venda de mídias avulsas dentro do chat;
- posts PPV;
- gorjetas/mimos;
- free trial de 24 horas;
- cupons;
- desconto temporário limitado;
- programa de indicação/afiliados.

## REGRAS DE ASSINATURA
Status possíveis da assinatura:
- ativa;
- cancelada;
- vencida;
- inadimplente;
- trial.

A renovação da assinatura deve ser automática por padrão.
O status da assinatura modela o contrato financeiro/comercial, não o estado social da relação entre usuário e creator.

## REGRA DE FREE TRIAL
O free trial terá duração de 24 horas.
O trial será aplicável a uma única creator, a critério do cliente.
O trial será usado apenas como prêmio do joguinho/promocional.
Para liberar o trial, será obrigatório o cadastro com documento.

Regra de acesso do trial:
- libera conteúdo privado de assinatura;
- não libera conteúdo PPV;
- conteúdo PPV continua bloqueado e exige pagamento individual do post, mesmo para assinante em trial.

## CUPONS E DESCONTOS
O sistema deve suportar:
- cupons de desconto;
- campanhas temporárias;
- promoções limitadas por quantidade.

Exemplo:
- 50% de desconto para os próximos 3 assinantes.

## AFILIADOS
O portal de afiliados deve suportar:
- geração de link único;
- tracking por creator;
- tracking por campanha;
- cookie/janela de atribuição de 14 dias;
- painel de cliques, conversões e comissões;
- payout;
- status de comissão.

Modelo de comissão:
- 30% na aquisição inicial;
- 10% na recorrência.

## RELAÇÃO USUÁRIO -> CREATOR
Cada relação usuário -> creator deve possuir estados claros:
- follower;
- subscriber_active;
- subscriber_expired;
- subscriber_canceled;
- trial_active;
- blocked;
- muted.

Esses estados modelam relacionamento e permissão contextual com o creator. Eles não substituem nem resumem o status da assinatura financeira.

## VISIBILIDADE DE POSTS E MÍDIAS
Cada post/mídia deve aceitar pelo menos:
- public;
- followers_only;
- subscribers_only;
- ppv_locked;
- custom_list_only.

A visibilidade define a política editorial do conteúdo. O direito efetivo de acesso ainda depende do estado do relacionamento, da assinatura e, quando existir, do unlock PPV.

## ORDEM DE PRECEDÊNCIA DE ACESSO AO CONTEÚDO
Aplicar sempre nesta ordem:

1. **Conta e RBAC**
- se o usuário não tem acesso à área, nada abaixo deve ser avaliado;
- usuário banido, bloqueado globalmente ou sem permissão de rota não acessa conteúdo nem operação.

2. **Relação usuário -> creator**
- `blocked` vence qualquer outro estado;
- `muted` afeta comunicação, não necessariamente acesso a conteúdo;
- `follower` não implica assinatura.

3. **Status da assinatura**
- `ativa` e `trial` podem conceder acesso a conteúdo de assinatura;
- `cancelada`, `vencida` ou `inadimplente` não devem ser interpretadas como acesso ativo, salvo regra temporária explícita.

4. **Visibilidade do conteúdo**
- `public` independe de follow ou assinatura;
- `followers_only` exige follow;
- `subscribers_only` exige acesso de assinatura válido;
- `custom_list_only` exige pertencer à lista permitida.

5. **Regra PPV**
- `ppv_locked` exige compra individual registrada;
- assinatura ativa não substitui PPV;
- trial não substitui PPV.

## BANCO / ENTIDADES CANÔNICAS DO DOMÍNIO
Além das tabelas já existentes, o modelo alvo precisa contemplar pelo menos estas entidades ou equivalentes semânticas:

**Identidade e acesso**
- `users`;
- `sessions`, se aplicável ao stack/auth;
- `user_roles`, se o projeto decidir desacoplar roles do `users`.

**Creators e descoberta**
- `creator_profiles` ou estrutura equivalente para separar perfil público do creator da conta autenticada;
- `follows`;
- `favorites`;
- `stories`;
- `creator_analytics_daily`.

**Conteúdo e biblioteca**
- `posts`;
- `post_media` ou relacionamento equivalente entre post e mídia;
- `media_vault`;
- `likes`;
- `comments`;
- `bookmarks`;
- `collections`;
- `collection_items`;
- `bundles`.

**Assinaturas e monetização**
- `subscription_plans`;
- `subscriptions`;
- `subscription_renewals` ou histórico equivalente;
- `payments`;
- `ppv_items`;
- `content_unlocks`;
- `tips`;
- `coupons`;
- `coupon_redemptions`;
- `payouts`;
- `wallets`;
- `financial_ledger`;
- `refunds` ou estrutura equivalente;
- `chargeback_cases` ou estrutura equivalente.

**Chat e campanhas**
- `chats`;
- `chat_messages`;
- `message_campaigns`;
- `message_campaign_recipients`.

**Afiliados**
- `affiliate_links`;
- `affiliate_tracking`;
- `affiliate_commissions`.

**Risco, moderação e compliance**
- `reports`;
- `moderation_actions`;
- `audit_logs` ou tabela equivalente;
- `kyc_submissions` ou tabela equivalente.

**Tempo real**
- `live_sessions`;
- `call_sessions`.

**Segmentação**
- `user_labels`;
- `user_segments`.

Regras de schema:
- se uma tabela já existir com outro nome, preservar a semântica e evitar duplicidade funcional;
- novas features de chat devem nascer em `chats` + `chat_messages`, não em `messages` legado;
- histórico de unlock, cupom, renovação e payout não deve ser inferido apenas por campos atuais;
- tabelas financeiras devem ser auditáveis e reconciliáveis.

## REGRAS SENSÍVEIS
Definir desde o início:
- status de pagamento;
- reembolso;
- expiração de acesso;
- cancelamento;
- renovação;
- chargeback;
- bloqueio geográfico, se houver;
- rate limits no chat;
- storage e CDN;
- compressão/transcoding de mídia;
- watermark dinâmica;
- log de auditoria;
- consentimento e aceite de termos;
- KYC / verificação de creator.

## PENDÊNCIAS DE REGRA DE NEGÓCIO
Ainda não definido:
- política de chargeback;
- política de suspensão/bloqueio financeiro após chargeback;
- regras detalhadas de reembolso;
- critérios futuros do ranking/top creators;
- regras avançadas de antifraude.

## TERMS OF SERVICE
Last updated: [DATE]
Welcome to [FantasyIA]. By accessing or using our platform, you agree to the following terms.
Eligibility: You must be at least 18 years old to access this website and confirm that you are of legal age in your jurisdiction.
Nature of the Service: [fantasyia.com] provides subscription-based access to digital content, including images and videos. All content is generated using artificial intelligence, is entirely fictional, and does not depict real individuals.
Account & Subscription: Users may subscribe to access premium content. Subscriptions are billed on a recurring basis unless canceled.
Available plans:
- Monthly
- Quarterly
- Annual
Payments: Payments are processed through third-party payment providers. By purchasing, you agree to the billing terms presented at checkout.
Refund Policy: Due to the digital nature of our content, all purchases are final unless otherwise required by law.
Content Usage: All content is proprietary and owned by [FantasyIA]. Redistribution, copying, or resale is strictly prohibited.
Prohibited Use:
- Share account access
- Attempt to reverse engineer content
- Use the platform for illegal purposes
Disclaimer: All characters are fictional and generated by AI. Any resemblance to real persons is purely coincidental.
Termination: We reserve the right to suspend or terminate accounts violating these terms.
Contact: [EMAIL]

## PRIVACY POLICY
Last updated: [DATE]
[fantasyia.com] respects your privacy.
Information Collected:
- Email address
- Payment-related information
- Usage data
- Verification/KYC data when required
Payment Processing: All payments are handled by third-party processors. We do not store full payment details.
Data Usage:
- Provide services
- Improve user experience
- Prevent fraud
- Validate eligibility where applicable
Data Sharing:
- Payment processors
- Identity verification providers
- Legal authorities if required
Security: We implement security measures to protect user data.
Cookies: We may use cookies to enhance experience, track affiliate attribution, and improve performance.
User Rights: Users may request data deletion by contacting [EMAIL].
Contact: [EMAIL]

## REFUND POLICY
All purchases are final.
Due to the digital nature of our content, we do not provide refunds once access has been granted, unless otherwise required by applicable law.
If you believe there has been an error, please contact support at [EMAIL].

## AGE VERIFICATION PAGE
By entering this website, you confirm:
- You are at least 18 years old
- You understand this website contains adult content
- You agree to view this content voluntarily
If you are under 18, you must leave immediately.

## DMCA / COPYRIGHT POLICY
We respect intellectual property rights.
If you believe content infringes your rights, please contact: [EMAIL]
Include:
- Your contact details
- Description of the content
- Proof of ownership
We will review and remove content if necessary.

## AI DISCLAIMER
All content available on this platform is generated using artificial intelligence.
- No real individuals are depicted
- All characters are fictional
- No content is based on real persons
- This platform does not feature real models
Any resemblance to real individuals is purely coincidental.

## OBSERVAÇÕES DE IMPLEMENTAÇÃO
- Todo o ecossistema do FantasyIA deve seguir interface mobile-first.
- Nenhuma área deve ser desenhada prioritariamente como desktop-first com exceção do backend editorial do Redator de Blog.
- Mesmo em desktop, a experiência deve manter lógica visual e estrutural de app mobile em todas as áreas, exceto no backend editorial do blog.
- O sistema deve manter RBAC rígido entre Assinante, Creator Studio, Admin CRM, Affiliate Portal e Blog.
- O acesso ao conteúdo deve sempre respeitar a ordem: RBAC -> relação usuário/creator -> assinatura -> visibilidade -> PPV.
- Trial não substitui compra de PPV.
- Assinatura não substitui compra de PPV quando o conteúdo estiver marcado como `ppv_locked`.
- Não criar novas regras de negócio críticas apenas em `user_metadata`.
- Para qualquer expansão do domínio de chat, adotar `chats` + `chat_messages` como modelo canônico.

## STACK TECNOLÓGICA E REGRAS
- **Framework**: Next.js 16+ (App Router). Antes de alterar APIs, convenções ou estrutura do framework, consultar os guias locais em `node_modules/next/dist/docs/`.
- **UI**: Tailwind CSS 4. Foco em interfaces fluidas, premium, mobile-first e com linguagem visual de app.
- **Banco de Dados e Auth**: PostgreSQL via Supabase.
- **ORM**: Drizzle ORM.
- **Segurança e Mutações**: uso exclusivo de Server Actions. O banco de dados deve refletir as permissões isoladas (RBAC), garantindo que um usuário comum não acesse rotas do Admin CRM ou do Studio. O middleware pode restringir navegação, mas as regras definitivas precisam existir no banco e na camada de domínio.

## PROGRESSO E PADRÕES ATUAIS (STATUS DE IMPLEMENTAÇÃO FUNCIONAL)
- **Estruturas de Banco de Dados e Drizzle**:
  O estado atual já possui pelo menos estas estruturas consolidadas:
  - `users` (roles e credenciais conectadas ao Auth do Supabase);
  - `posts`, `likes`, `comments`, `favorites`, `follows` e `messages` (motor social base atual);
  - `blog_articles` (isolado da timeline principal para SEO);
  - `affiliate_links` e `affiliate_tracking` (cliques, `utm_source` e rastreio de funil).
- **Importante sobre mensagens**:
  - `messages` representa o estado atual do motor social;
  - para nova modelagem do domínio de chat, considerar `chats` + `chat_messages` como alvo canônico;
  - evitar expandir features comerciais complexas diretamente em `messages` se já houver decisão de introduzir o modelo canônico.
- **Mutações Integradas**:
  A plataforma já opera interações e loops renderizando server-side através da pasta `src/lib/actions/`. O Supabase client realiza login, signup e transferências de storage (uploads).
- **Defesa RBAC (Middleware)**:
  O middleware do Next.js monitora o tráfego ativamente. Nenhuma das 5 áreas pode ser acessada caso a sessão do cookie de Auth não carregue a metadata com o respectivo `user_metadata.role`.
