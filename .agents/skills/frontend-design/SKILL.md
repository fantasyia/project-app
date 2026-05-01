---
name: frontend-design
description: |
  Create distinctive, production-grade frontend interfaces for FantasyIA.
  Use this skill whenever the user asks to build or refine pages, components,
  layouts, app screens, dashboards, landing pages, blog pages, or any visual
  frontend in this repository. Always align with the project context in
  `../project-plaintext-context/SKILL.md`: dark mode only, mobile-first across
  the platform, clear separation between public and private areas, correct use
  of subscription/PPV/chat states, and the official brand palette. The project
  context overrides generic design preferences.
license: Complete terms in LICENSE.txt
---

# Frontend Design For FantasyIA

Este skill existe para evitar frontend bonito, mas desalinhado com o produto.
O objetivo nao e apenas fazer interfaces visualmente fortes. O objetivo e fazer interfaces claras, coerentes com o dominio e impossiveis de confundir com um SaaS generico, ERP claro ou clone de feed premium sem identidade.

## Primeira Regra
- Antes de projetar ou codar qualquer interface do FantasyIA, leia `../project-plaintext-context/SKILL.md`.
- Para priorização e escopo da tela/feature, consulte também `../../../docs/sdd/`.
- Se houver conflito entre este skill e o contexto do projeto, o `project-plaintext-context` vence.
- Nao inventar regra de negocio, fluxo de acesso, permissao, monetizacao ou nomenclatura fora do que estiver definido no contexto do projeto.
- Se o codigo atual do repo ainda estiver usando paleta dourada, `Inter` ou nomenclatura antiga, tratar isso como legado de implementacao e nao como fonte de verdade do design.

## Objetivo Visual Do Produto
O FantasyIA deve parecer:
- premium;
- noturno;
- sofisticado;
- mobile-first;
- artistico;
- seguro;
- mais proximo de um app imersivo do que de um site comum.

Nao deve parecer:
- landing page branca de startup;
- dashboard SaaS generico;
- ERP tradicional;
- painel administrativo claro e burocratico;
- clone visual previsivel de plataforma premium pronta.

## Regras Nao Negociaveis Do Projeto
- A plataforma opera somente em modo escuro.
- Nunca criar light mode, alternador de tema ou versao clara paralela.
- Todo o ecossistema deve ser mobile-first.
- A unica area que pode ser desktop-first e o backend editorial do Redator de Blog.
- O frontend publico continua mobile-first.
- A Area do Assinante e o app principal e deve parecer app mobile real.
- O chat e canal comercial central da plataforma, nao apenas conversa.
- O frontend nao pode sugerir regras erradas de acesso a conteudo.
- O frontend nao pode confundir `creator`, `user`, `subscription`, `relationship state`, `content visibility` e `PPV unlock`.

## Hierarquia De Prioridade
Quando houver duvida de design ou fluxo, seguir esta ordem:
- regras de RBAC e acesso;
- relacao usuario -> creator;
- status da assinatura;
- visibilidade do conteudo;
- desbloqueio PPV;
- preferencia estetica.

Ou seja: o design nunca pode ficar bonito as custas de contar a regra errada.

## Plataforma So No Modo Escuro
Regras obrigatorias:
- usar apenas tema escuro;
- usar fundos escuros ou quase pretos;
- usar superficies escuras elevadas;
- usar contraste de texto claro sobre fundo escuro;
- nao usar paginas predominantemente brancas;
- nao usar cards claros como base do sistema;
- nao usar componentes que dependam de tema claro para funcionar bem.

Permitido:
- preto;
- cinza grafite;
- carvao escuro;
- transparencias escuras;
- glow controlado;
- gradientes escuros;
- overlays suaves.

## Cores Oficiais Da Marca
Usar estas cores como paleta oficial inicial da plataforma:

- `#00a86b`
- `#00ff9c`
- `#00c17c`
- `#007a4d`
- `#e5e5e5`
- `#c0c0c0`
- `#8a8a8a`

Recomendacao de papeis:
- `#00a86b`: primaria da marca;
- `#00ff9c`: destaque luminoso, foco, hover premium, glow, ativo, CTA de alto impacto;
- `#00c17c`: apoio da marca, gradientes, badges, estados ativos secundarios;
- `#007a4d`: versao profunda para pressed state, bordas, grafismos, graficos e superficies verdes mais densas;
- `#e5e5e5`: texto principal;
- `#c0c0c0`: texto secundario;
- `#8a8a8a`: texto auxiliar, placeholders, labels discretos.

## Regras De Uso Da Paleta
- Expor a paleta em variaveis CSS/tokens desde o inicio.
- A cor verde da marca deve liderar a identidade visual.
- O acento neon `#00ff9c` deve ser usado com intencao, nao espalhado em tudo.
- Tons neutros devem sustentar legibilidade e hierarquia.
- Cores extras de erro/alerta podem existir se necessarias, mas sem disputar protagonismo com a marca.
- Evitar paletas roxas, azuladas ou pasteis que descaracterizem o produto.
- Evitar gradientes aleatorios sem relacao com a marca.

## Tokens Recomendados
Ao estilizar, preferir algo neste formato:

```css
:root {
  --brand-500: #00a86b;
  --brand-accent: #00ff9c;
  --brand-400: #00c17c;
  --brand-700: #007a4d;
  --text-strong: #e5e5e5;
  --text-base: #c0c0c0;
  --text-muted: #8a8a8a;
}
```

## Publico Vs Privado
Esta separacao precisa ser muito clara.

### Frontend Publico
Inclui:
- home publica;
- landing pages;
- paginas institucionais;
- blog publico;
- paginas de descoberta abertas;
- paginas de conversao.

Regras:
- continua mobile-first;
- pode usar composicao mais editorial, atmosferica e cinematografica;
- nao precisa simular uma tela de celular o tempo todo;
- pode usar layout full-width responsivo;
- deve converter para assinatura e descoberta;
- deve incluir rodape com `Terms | Privacy | Refund | DMCA | AI Disclaimer`;
- deve parecer parte do mesmo universo visual da plataforma privada.

### Area Do Assinante
Inclui o app principal do usuario logado.

Regras:
- 100% mobile-first;
- em desktop deve simular app mobile com `max-w-md` centralizado;
- usar bottom navigation;
- nunca usar sidebar;
- priorizar feed, descoberta, mensagens, perfil e fluxos verticais;
- usar drawers, modais, cards, stacks, listas e paineis compactos;
- deve parecer produto/app, nao site institucional.

### Creator Studio
Regras:
- mobile-first;
- pode ter layout hibrido para upload e operacao;
- ainda deve parecer app e nao backoffice tradicional;
- precisa suportar criacao de conteudo, metricas e operacao comercial do chat.

### Admin CRM
Regras:
- mobile-first;
- mais denso e operacional;
- sidebar pode existir quando realmente ajudar;
- tabelas podem existir quando necessarias;
- ainda deve funcionar bem no celular;
- evitar visual de ERP branco e antigo.

### Affiliate Portal
Regras:
- mobile-first;
- performance e conversao como foco;
- pode ser mais analitico, mas ainda com cara de app dark da marca.

### Redator De Blog
Regras:
- backend editorial e a unica excecao desktop-first;
- ainda deve respeitar dark mode e identidade da marca;
- o blog publico continua mobile-first.

## Dados E Regras Do Projeto Que O Frontend Precisa Respeitar

### Home / Descoberta
A home da plataforma deve poder incluir:
- feed global;
- top 5 creators;
- stories por creator.

### Perfil Publico Do Creator
O perfil do creator precisa ser capaz de exibir:
- avatar;
- capa;
- bio;
- preco da assinatura;
- botao seguir;
- botao assinar;
- botao mandar mensagem;
- botao enviar gorjeta;
- total de posts;
- total de fotos;
- total de videos;
- likes/favoritos;
- posts fixados;
- destaques/stories;
- link de afiliado, se aplicavel.

### Assinaturas
Planos suportados:
- mensal;
- trimestral;
- anual.

### Chat
O chat deve ser tratado como canal de venda e precisa suportar:
- texto;
- audio;
- imagem;
- video;
- GIF/emoji;
- midia paga travada;
- venda de midias avulsas;
- mensagem automatica de boas-vindas;
- mensagem em massa;
- filtros;
- favoritos;
- reativacao de expirados;
- solicitacao de pagamento/gorjeta.

### Conteudo E Acesso
Visibilidades principais:
- `public`;
- `followers_only`;
- `subscribers_only`;
- `ppv_locked`;
- `custom_list_only`.

Estados de relacao usuario -> creator:
- `follower`;
- `subscriber_active`;
- `subscriber_expired`;
- `subscriber_canceled`;
- `trial_active`;
- `blocked`;
- `muted`.

Status de assinatura:
- `ativa`;
- `cancelada`;
- `vencida`;
- `inadimplente`;
- `trial`.

## Regras De UX Para Nao Mentir Sobre O Produto
- Nao mostrar PPV como desbloqueado apenas porque o usuario assina.
- Nao mostrar PPV como desbloqueado apenas porque o usuario esta em trial.
- Trial libera conteudo de assinatura, mas nao libera PPV.
- Trial dura 24 horas e se aplica a uma unica creator.
- O frontend deve diferenciar claramente:
  - seguir;
  - assinar;
  - trial;
  - conteudo desbloqueado por PPV;
  - conteudo bloqueado por relacao/visibilidade.
- Evitar um unico badge generico como "Premium" para todos os casos.
- Quando existir paywall, indicar por que o acesso esta bloqueado.

## Direcao Estetica
Pensar sempre em uma mistura de:
- luxo noturno;
- interface de app premium;
- atmosfera artistica;
- brilho controlado;
- contraste alto;
- hierarquia clara;
- sensualidade visual com contencao;
- profundidade sem excesso decorativo.

O publico pode ser mais editorial e atmosferico.
O privado deve ser mais funcional, mas ainda sofisticado.

## Tipografia
- Tipografia definitiva da marca ainda nao esta fechada.
- Nao transformar escolhas temporarias de fonte em regra permanente do projeto.
- Enquanto a fonte oficial nao for definida, priorizar combinacoes que reforcem elegancia e legibilidade no dark mode.
- Se o usuario pedir, trocar ou aprofundar tipografia depois.

## Movimento E Interacao
- Animacoes devem reforcar atmosfera premium e clareza.
- Priorizar transicoes suaves, reveals, hover states, foco visivel e microinteracoes de alto valor.
- Evitar animacao excessiva que prejudique leitura ou pareca exibicao gratuita.
- Em areas privadas, performance e legibilidade vencem exibicionismo.

## Composicao
- Evitar layouts genericos de template.
- Buscar identidade forte, mas respeitar o papel da tela.
- Publico: mais liberdade cenica e narrativa.
- Privado: mais densidade funcional, sem perder refinamento.
- Admin e afiliados: densidade permitida, desde que a experiencia movel continue clara.

## O Que Evitar
- light mode;
- fundo branco dominante;
- roxo como cor principal;
- visual de SaaS generico;
- sidebar no app do assinante;
- interface desktop-first para areas privadas, exceto backend editorial do blog;
- misturar status de assinatura com relacao social;
- tratar chat como detalhe secundario;
- tratar a plataforma como simples feed premium;
- esconder PPV, trial e estados de acesso sob uma unica linguagem vaga.

## Regras De Implementacao
- Implementar codigo real, nao mockup estatico.
- Usar variaveis de cor/tokens.
- Manter contraste, acessibilidade e legibilidade no dark mode.
- Componentes devem ser reutilizaveis quando fizer sentido.
- Em React/Next.js, respeitar os padroes atuais do projeto.
- Antes de usar APIs ou convencoes do Next.js, consultar os guias locais em `node_modules/next/dist/docs/` quando a tarefa envolver comportamento de framework.
- Ao nomear estados, tabs, filtros, badges e CTAs, usar a semantica do projeto em vez de termos vagos.

## Regra Final
Se uma tela estiver bonita, mas:
- quebrar mobile-first;
- sugerir regra errada de acesso;
- parecer clara;
- parecer SaaS generico;
- ignorar a paleta da marca;
- ou conflitar com `project-plaintext-context`;

entao a tela esta errada.
