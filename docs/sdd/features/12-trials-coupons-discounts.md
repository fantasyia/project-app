# Feature Spec: Trials, Cupons e Descontos

## 1. Identificacao
- Nome da feature: Trials, Cupons e Descontos Promocionais
- Dominio: `plataforma-core` / `subscriber` / `creator` / `admin` / `affiliate`
- Status: `later`

> Update 2026-04-20: esta frente foi separada do checkout/PPV para evitar mistura de regras. Trial pode liberar conteudo premium de assinatura por tempo limitado, mas nunca libera PPV. Cupons/descontos devem afetar preco/cobranca, nao entitlement direto.

## 2. Problema
- O que falta? A plataforma ainda nao possui schema e fluxos dedicados para free trial de 24 horas, cupons, descontos limitados e campanhas promocionais.
- Por que importa? Essas regras impactam aquisicao, afiliados, funil comercial e auditoria financeira. Se forem misturadas diretamente em `subscriptions`, `ppv_unlocks` ou flags de usuario, o produto perde clareza e fica dificil auditar.

## 3. Usuarios Afetados
- `subscriber`: usa trial, cupom ou desconto.
- `creator`: pode ter campanhas ligadas ao proprio perfil.
- `admin`: define campanhas globais, limites e regras antifraude.
- `affiliate`: pode ter campanhas rastreadas e comissao associada.

## 4. Escopo Funcional
- Trial promocional de 24 horas para um unico creator, condicionado a regra de negocio final e KYC/documento quando aplicavel.
- Cupons de desconto com codigo, escopo, validade, limite de uso e tipo de desconto.
- Descontos temporarios limitados por quantidade ou janela de tempo.
- Aplicacao de desconto no checkout de assinatura.
- Historico/auditoria de uso de cupom e ativacao de trial.

## 5. Fora De Escopo Nesta Fase
- Integracao real com gateway de pagamento.
- Regras finais de antifraude, chargeback ou reembolso.
- Liberar PPV por trial, cupom ou assinatura.
- Aplicar desconto diretamente em `ppv_unlocks` sem decisao comercial explicita.

## 6. Regras De Negocio
- Trial dura 24 horas.
- Trial libera apenas conteudo premium de assinatura.
- Trial nao libera PPV em post nem midia paga no chat.
- Um usuario nao deve poder acumular trials ilimitados para o mesmo creator.
- Cupom/desconto muda preco ou evento financeiro, nao muda a regra de acesso por si so.
- Todo uso de cupom/trial deve gerar historico auditavel.
- Descontos recorrentes precisam declarar se afetam somente a primeira cobranca ou tambem renovacoes.
- Afiliados e cupons nao devem duplicar comissao sem regra explicita.

## 7. Impacto Em Dados / Schema Alvo
- `trials` ou `trial_redemptions`: usuario, creator, origem, inicio, fim, status e motivo.
- `coupons`: codigo, tipo, valor, escopo, validade, limite de uso, status e owner/admin.
- `coupon_redemptions`: usuario, coupon, subscription/payment relacionado, valor aplicado e timestamp.
- `campaigns` ou equivalente: descontos limitados por tempo/quantidade.
- `payments` e `financial_ledger`: devem registrar valor bruto, desconto aplicado, valor liquido e referencia da campanha/cupom.

## 8. Impacto Em RBAC
- `admin`: cria campanhas globais, limites e cupons oficiais.
- `creator`: pode criar campanhas do proprio perfil se a regra de produto permitir.
- `subscriber`: apenas consome trial/cupom validado pelo backend.
- `affiliate`: pode receber links/campanhas rastreadas, mas nao deve aprovar desconto financeiro sozinho.

## 9. Impacto Em UI
- Checkout de assinatura deve aceitar cupom/campanha e mostrar valor original, desconto e total local.
- Perfil publico do creator pode exibir oferta ativa sem confundir com PPV.
- App do usuario deve mostrar trial ativo como acesso temporario, separado de assinatura paga.
- Creator Studio pode mostrar performance de campanha em cards, nao em tabela pesada.

## 10. Acceptance Criteria Futuro
- [ ] Trial de 24 horas modelado sem liberar PPV.
- [ ] Cupom com escopo, validade, limite e auditoria.
- [ ] Checkout exibindo subtotal, desconto e total.
- [ ] Ledger registrando bruto, desconto, taxa e liquido.
- [ ] Regras de afiliado/cupom sem dupla contagem.
- [ ] Admin/creator com controles mobile-first para campanhas.

## 11. Ordem Recomendada
1. Definir regras finais de trial/cupom/desconto.
2. Criar schema e migrations.
3. Atualizar checkout local com aplicacao de cupom.
4. Atualizar ledger local com campos de desconto/referencia.
5. Criar UI mobile-first para admin/creator gerenciar campanhas.
6. Validar que PPV continua exigindo unlock explicito.
