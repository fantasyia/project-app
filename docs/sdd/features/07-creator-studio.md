# Feature Spec: Creator Studio

## 1. Identificacao
- Nome da feature: Creator Studio (wallet, inbox e operacao de conteudo)
- Dominio:
  `creator` / `frontend`
- Status:
  `done`

> Update 2026-04-21: a frente principal do Creator Studio foi concluida para Fase 2, com composer real, monetizacao base, inbox comercial e continuidade visual entre modulos.

## 2. Escopo Entregue
- Composer real em `/dashboard/creator/posts/create`.
- Upload real no Supabase Storage.
- Tiers de monetizacao (`free`, assinatura, PPV).
- Studio snapshot com wallet/recorrencia/PPV/mix.
- Biblioteca de posts com badges de monetizacao.
- Inbox comercial integrado ao chat canonico.
- Passada de continuidade visual entre `messages`, `plans`, `posts` e shell.

## 3. Acceptance Criteria
- [x] Composer conectado ao backend local.
- [x] Upload real funcional.
- [x] Snapshot operacional do Studio.
- [x] Inbox comercial com estados premium.
- [x] Continuidade visual entre inbox, planos e operacao de conteudo.

## 4. Backlog Futuro (Pre-Lancamento)
- [ ] Conciliacao financeira real com gateway homologado.
- [ ] Insights financeiros avancados com dados reais de cobranca.
