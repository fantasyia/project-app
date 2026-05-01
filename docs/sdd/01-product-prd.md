# FantasyIA - Product PRD

## 1. Resumo Do Produto
FantasyIA e uma rede social artistica privada premium, com experiencia mobile-first, consumo imersivo de midia, monetizacao por assinatura, PPV, chat comercial e afiliados.

O produto nao deve ser tratado como simples feed premium.
O chat e um canal comercial central da plataforma.

## 2. Objetivo Do Produto
Construir um ecossistema digital premium com:
- descoberta de creators;
- consumo de conteudo privado e publico;
- conversao por assinatura;
- desbloqueio PPV;
- relacionamento via chat;
- operacao de creators;
- administracao global;
- aquisicao via afiliados;
- topo de funil via blog/editorial publico.

## 3. Areas Do Produto

### 3.1 Frontend Publico
Inclui:
- landing/home publica;
- paginas institucionais;
- paginas abertas de descoberta;
- blog publico;
- SEO/topo de funil.

Regras:
- mobile-first;
- dark mode only;
- visual editorial e atmosferico;
- deve converter para assinatura/descoberta;
- deve manter identidade comum com o produto privado.

### 3.2 Area Do Assinante
E o app principal do produto.

Regras:
- 100% mobile-first;
- em desktop simula app mobile;
- bottom navigation obrigatoria;
- feed, descoberta, mensagens e conta como navegacao base;
- nao usar sidebar;
- o chat precisa aparecer como fluxo central do produto.

### 3.3 Creator Studio
Regras:
- mobile-first;
- operacao de conteudo, audiencia e performance;
- suporte a publicacao, gestao de perfil e operacao comercial do chat.

### 3.4 Admin CRM
Regras:
- app operacional mobile-first;
- controle global de usuarios, creators, risco, financas e moderacao;
- densidade maior permitida, sem virar ERP classico desconectado da marca.

### 3.5 Affiliate Portal
Regras:
- mobile-first;
- links, cliques, conversoes, comissoes e payout;
- foco em performance comercial.

### 3.6 Redator De Blog
Regras:
- backend editorial e a unica area desktop-first;
- blog publico continua mobile-first;
- arquitetura do blog deve seguir o preset Multi-Silo.

## 4. Perfis / Roles
- `subscriber`
- `creator`
- `admin`
- `affiliate`
- `editor` como papel de negocio
- `writer` como legado tecnico atual no codigo/auth

Regra:
- o produto deve caminhar para linguagem de negocio consistente;
- papeis legados podem continuar temporariamente por compatibilidade tecnica, mas nao devem guiar novas decisoes de dominio.

## 5. Monetizacao
O produto deve suportar:
- assinatura mensal, trimestral e anual por creator;
- renovacao automatica;
- posts PPV;
- midia paga dentro do chat;
- gorjetas;
- trial de 24h;
- cupons e campanhas;
- programa de afiliados.

### 5.1 Diretriz De Integracao Real De Pagamentos
- Stripe Integration, APIs REST de gateway, webhooks, antifraude e conciliacao financeira real ficam para o pre-lancamento.
- Ate la, o produto deve manter a estrutura pronta com placeholders trocaveis em `/pricing`, `/checkout/[planId]`, gestao de planos do creator e fluxo de unlock PPV.
- Nomes, precos, ciclos e IDs externos podem usar valores de exemplo agora, desde que a troca para dados reais aconteca sem retrabalho de UI.
- O objetivo desta etapa e validar jornada, UX, schema e contratos internos; a homologacao real entra somente quando a plataforma liberar os valores e a estrutura final dos planos.

## 6. Regras De Acesso
Aplicar sempre a sequencia:
1. RBAC
2. relacao usuario -> creator
3. status da assinatura
4. visibilidade do conteudo
5. unlock PPV

Regras criticas:
- trial nao libera PPV;
- assinatura nao substitui PPV;
- o frontend deve comunicar claramente o motivo do bloqueio;
- `subscription`, `relationship state` e `content visibility` nao podem ser misturados.

## 7. Home E Descoberta
A home deve poder contemplar:
- feed global;
- top creators;
- stories;
- busca por creators, tags e categorias;
- creators relacionados;
- favoritos;
- historico de compras e unlocks.

## 8. Chat
O chat precisa suportar:
- texto, audio, imagem, video, GIF/emoji;
- midia paga travada;
- venda avulsa;
- automacoes;
- mensagens em massa;
- filtros;
- favoritos;
- reativacao de expirados;
- solicitacao de pagamento/gorjeta.

## 9. Blog / Editorial
O blog serve como topo de funil, SEO e aquisicao.
O padrao tecnico de blog e o preset Multi-Silo documentado nos skills de blog e banco.

Regra:
- blog/editorial nao deve contaminar a modelagem do dominio principal do app privado.

## 10. Estado Atual Resumido
Com base no repositorio atual:
- existe estrutura inicial de dashboards por role;
- existe feed, busca, chat, notificacoes e acoes sociais basicas;
- existe base operacional para afiliados, incluindo tracking e comissoes;
- existe schema local com `creator_profiles`, `wallets`, `subscription_plans`, `subscriptions`, `ppv_unlocks`, `chats`, `chat_messages` e `affiliate_commissions`;
- existe pricing publico, checkout placeholder, gestao de planos do creator e unlock PPV;
- existe blog publico com silos e artigo individual, ainda precisando consolidar a taxonomia de rotas;
- existe skill/preset forte para o blog Multi-Silo;
- a implementacao visual, o modelo de cobranca e parte da nomenclatura ainda nao estao totalmente alinhados ao contexto canonico.

## 11. Principais Gaps De Produto
- paleta/branding no codigo ainda refletem fase anterior;
- faltam `billing_interval`, historico de renovacao, `payments`, `financial_ledger`, refunds e chargebacks no modelo local;
- blog Multi-Silo ja aparece no app local, mas ainda ha ambiguidade entre as rotas dinamicas de silo e slug;
- roles e nomenclaturas ainda tem legado (`writer`, `access_tier`);
- notificacoes existem no app, mas ainda precisam de cobertura explicita no schema local se virarem parte canonica do dominio;
- a integracao real com Stripe/gateway e os valores finais dos planos estao intencionalmente adiados para o pre-lancamento.
