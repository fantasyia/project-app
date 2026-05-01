# Feature Spec: App do Usuario (Subscriber UX)

## 1. Identificacao
- Nome da feature: Subscriber App (UX de consumo)
- Dominio:
  `subscriber` / `frontend`
- Status:
  `done`

> Update 2026-04-21: a frente mobile-first do app do usuario foi concluida na Fase 2. A rota publica canonica segue em `/dashboard/user/*`, com `/dashboard/subscriber/*` apenas como alias legado.

## 2. Escopo Entregue
- Shell mobile com `max-w-md`, topbar e bottom navigation.
- Feed com estados reais de acesso (livre, assinatura, trial, PPV desbloqueado, bloqueado).
- Mensagens com fluxo comercial completo (texto, gorjeta, midia premium e unlock).
- Notificacoes em realtime.
- Search, bookmarks, purchases e account em linguagem de produto.
- Continuidade visual premium final em `feed`, `account` e shell.

## 3. Regras De Negocio Garantidas
- PPV permanece separado de assinatura.
- Trial/assinatura nao liberam PPV.
- Historico financeiro do usuario agrega assinaturas, unlocks e gorjetas.

## 4. Acceptance Criteria
- [x] Feed principal respeita entitlement real.
- [x] UI bloqueada diferencia assinatura e PPV.
- [x] Shell mobile-first consolidado.
- [x] Chat comercial completo com unlock na thread.
- [x] Favoritos, filtros, busca e estados vazios no chat.
- [x] Polimento final de continuidade visual do app.

## 5. Backlog Futuro (Nao Bloqueia Fase 2)
- [ ] Evolucoes opcionais de discovery e personalizacao por segmentos.
