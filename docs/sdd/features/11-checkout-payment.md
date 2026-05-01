# Feature Spec: Checkout & Payment Gateway Structure

## 1. Identificacao
- Nome da feature: Checkout & Payment Gateway (Estrutura + Planos Exemplo)
- Dominio: `public` / `subscriber` / `creator` / `backend`
- Status: `in_progress`

> Nota pre-lancamento: os valores, nomes de planos e IDs Stripe sao placeholders.
> Eles serao atualizados com dados reais quando o gateway for homologado pela plataforma.

> Update 2026-04-17: o checkout local de assinatura e PPV ja persiste no banco e revalida feed, perfil publico e historico do usuario.
> `/pricing` foi revisado para uma composicao mobile-first mais coerente; o principal aberto nesta frente passou a ser a evolucao futura do modelo financeiro placeholder e a troca pelos dados comerciais reais no pre-lancamento.

> Update 2026-04-20: assinatura e PPV agora tentam registrar eventos locais em `payments`, `financial_ledger` e `wallets`, com fallback seguro quando o ambiente ainda nao tiver todas as tabelas financeiras. O historico do usuario passou a misturar assinaturas, unlocks e gorjetas.

> Update 2026-04-20: trials, cupons e descontos foram separados para `12-trials-coupons-discounts.md`. O checkout atual nao deve tratar trial/cupom como entitlement direto.

## 2. Problema
- O que falta? A jornada principal de monetizacao ja funciona localmente e ganhou eventos financeiros locais. Ainda falta a integracao real com gateway, politica final de trial/cupom e regras comerciais definitivas de pre-lancamento.
- Por que importa? Precisamos congelar a UX principal antes do gateway real e evitar retrabalho quando a homologacao financeira entrar.

## 3. Escopo Funcional
- Pricing page publica com planos exemplo da plataforma.
- Subscribe checkout em rota dedicada para assinar um creator.
- PPV unlock em rota dedicada para desbloqueio avulso.
- Creator plans management no Studio.
- Server actions locais que criam `subscriptions` e `ppv_unlocks` no banco.
- Registro local tolerante de `payments`, `financial_ledger` e wallet para simular receita, taxa e saldo operacional do creator.

## 4. Regras De Negocio
- Tudo opera com dados simulados, sem chamada a Stripe API.
- O campo `stripe_*` continua `null` ou `placeholder_xxx`.
- Quando Stripe for integrado, a fronteira principal de mudanca fica nas server actions.
- PPV e assinatura continuam separados.
- Valores, nomes comerciais e billing cycle final continuam placeholders trocaveis ate a definicao comercial final.
- Ledger local nao substitui conciliacao real do gateway; ele serve como UX e trilha de pre-lancamento.
- Trials, cupons e descontos pertencem a spec propria e devem afetar preco/cobranca, nao liberar PPV.

## 5. Acceptance Criteria
- [x] Pagina de pricing publica com 3 planos exemplo.
- [x] Checkout page com formulario funcional em modo local.
- [x] PPV unlock com confirmacao em rota dedicada.
- [x] Creator plans management no Studio.
- [x] Server actions mock alinhadas ao schema atual.
- [x] Heuristica local de billing cycle para mensal, trimestral e anual.
- [x] Revisao mobile-first final da pagina `/pricing`.
- [x] Modelo financeiro placeholder expandido com historico local mais rico.
- [ ] Integracao real de gateway e conciliacao financeira homologada.

## 6. Task Breakdown
- [x] Criar server actions mock iniciais (`subscribe`, `unlockPpv`, `getPlans`, `managePlans`).
- [x] Criar pagina publica `/pricing`.
- [x] Criar checkout page `/checkout/[planId]`.
- [x] Criar checkout PPV dedicado em `/checkout/ppv/[postId]`.
- [x] Criar gestao de planos no Creator Studio.
- [x] Corrigir o contrato do mock PPV/checkout para bater com o schema atual.
- [x] Adicionar placeholders de mensal/trimestral/anual via heuristica local de ciclo.
- [x] Revisar `/pricing` para aderencia mobile-first plena.
- [x] Expandir historico local de renovacao/eventos financeiros.
- [x] Exibir eventos financeiros locais no app do usuario e no Studio do creator.
- [ ] Integrar Stripe/gateway real apenas no pre-lancamento, com dados comerciais finais.
