---
name: fantasyia-domain-schema
description: |
  Guia de modelagem de domínio e evolução de schema do FantasyIA.
  Use este skill sempre que a tarefa envolver tabelas, enums, migrações,
  relações entre subscriber/creator/assinatura/PPV/chat/afiliados, decisões de
  nomenclatura do banco, expansão do Drizzle schema, ou validação de que uma
  mudança técnica respeita o domínio canônico do projeto.
---

# FantasyIA Domain Schema

Este skill ajuda a evitar que o banco cresça de forma improvisada ou contraditória com o produto.

## Ler Antes
1. `../project-plaintext-context/SKILL.md`
2. `../supabase-postgres-best-practices/SKILL.md`
3. `../../../docs/sdd/02-architecture-plan.md`
4. `../../../docs/sdd/03-task-breakdown.md`

## Princípios Canônicos
- `user` não é igual a `creator`;
- `subscription status` não é igual a `relationship state`;
- `content visibility` não é igual a `entitlement`;
- `ppv unlock` não é igual a assinatura;
- `chat` não é igual a `chat_message`;
- ledger financeiro não deve depender de campos implícitos ou estados inferidos.

## Fluxo De Trabalho

### 1. Entender O Tipo De Mudança
Classifique a mudança:
- nova entidade;
- expansão de entidade existente;
- normalização;
- migração legado -> alvo canônico;
- ajuste de naming;
- regra de acesso/entitlement;
- regra financeira.

### 2. Validar Impacto De Domínio
Responder:
- essa mudança toca subscriber, creator, afiliado, editor ou admin?
- essa mudança é social, monetária, editorial, operacional ou híbrida?
- existe risco de misturar domínios que deveriam ficar separados?

### 3. Escolher O Modelo Certo
Preferir:
- tabelas explícitas;
- enums auditáveis;
- histórico dedicado;
- nomenclatura canônica do projeto;
- caminhos de migração claros quando houver legado.

Evitar:
- sobrecarregar `users` com tudo;
- jogar histórico em JSON;
- expandir `messages` legado para features de chat comercial avançadas;
- usar `access_tier` simples para cobrir todos os cenários de assinatura/PPV.

### 4. Registrar A Decisão
Toda mudança relevante deve refletir também:
- no feature spec correspondente;
- no `02-architecture-plan.md`, se mudar a arquitetura alvo;
- no `03-task-breakdown.md`, se abrir ou fechar trabalho novo.

## Separações Obrigatórias

### Domínio Principal Do App
Inclui:
- creator profiles;
- relationships;
- subscriptions;
- payments;
- content unlocks;
- chats;
- tips;
- affiliate commissions;
- ledger.

### Domínio Do Blog
Inclui:
- silos;
- posts editoriais;
- auditoria SEO;
- Tiptap/editor;
- link analysis;
- rotas públicas de blog.

Não cruzar essas duas áreas sem motivo claro.

## Regra Final
Se uma modelagem parecer conveniente, mas:
- esconder regra importante;
- misturar conceitos canônicos;
- impedir auditoria;
- ou aumentar a confusão entre legado e alvo;

então a modelagem está errada.
