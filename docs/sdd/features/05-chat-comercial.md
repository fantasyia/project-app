# Feature Spec: Chat Canonico e DM Comercial

## 1. Identificacao
- Nome da feature: Chat Canonico (conversas 1x1, gorjetas e midia paga)
- Dominio:
  `plataforma-core` / `subscriber` / `creator`
- Status:
  `done`

> Update 2026-04-21: o chat canonico esta concluido para Fase 2, com fluxo comercial funcional em tempo real no app do usuario e no Creator Studio.

## 2. Escopo Entregue
- Modelo canonico em `chats` + `chat_messages`.
- Thread com envio de texto, gorjeta e oferta de midia PPV.
- Unlock de mensagem premium direto na conversa.
- Estados de acesso `locked`, `unlocked` e `owner`.
- Favoritos locais de conversa, filtros, busca e estados vazios premium.
- Historico de compras consolidando unlocks de post e unlocks do chat.

## 3. Regras De Negocio Garantidas
- `ppv_locked` exige unlock explicito.
- Assinatura/trial nao liberam PPV no chat.
- Sender enxerga a propria oferta como `owner`.
- Unlock de chat gera trilha em `ppv_unlocks.message_id`.

## 4. Acceptance Criteria
- [x] `chats` e `chat_messages` operando como modelo canonico.
- [x] Thread suportando texto, gorjeta e midia premium.
- [x] Unlock de mensagem premium dentro da conversa.
- [x] `ppv_unlocks.message_id` refletido no backend local.
- [x] Historico de compras incluindo unlocks do chat.
- [x] Passada de polish mobile-first nos estados premium do chat.

## 5. Backlog Futuro (Nao Bloqueia Fase 2)
- [ ] Broadcasts comerciais e automacoes mais profundas de DM.
- [ ] Regras de campanha comercial em massa acopladas ao CRM/admin.
