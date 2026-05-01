# Feature Spec: 01 Branding & Tokens

Use este template para qualquer nova feature ou refactor relevante.

## 1. Identificação
- Nome da feature: Alinhamento de Branding e Tokens Visuais
- Domínio:
  `plataforma-core` / `publico`
- Status:
  `approved`

## 2. Problema
- O que está faltando? O código atual ainda reflete uma versão legada do branding (paleta dourada, dependência hardcoded na fonte Inter). Não há um source of truth codificado para tokens (margens, dark-mode colors) da nova paleta.
- Por que isso importa para o produto? Previne inconsistências visuais em novas features, facilita o uso do Tailwind pelas IAs, e garante a atmosfera 'FantasyIA' descrita no `frontend-design`.

## 3. Usuários Afetados
- Quem usa? Todos (Público, Subscribers).
- Quem opera? Admin, Creators (UI interna).
- Quem administra? Não se aplica.

## 4. Escopo Funcional
- O que a feature faz? Atualiza `tailwind.config.ts`, `globals.css` (ou `index.css`) definindo a paleta de cores verde/cinza do projeto e remove propriedades conflitantes. Refatora botões globais e text patterns.
- O que explicitamente não faz? Não refatora a lógica de negócio dos componentes e não muda componentes isolados estruturalmente (a menos que dependam imperativamente do branding velho).

## 5. Regras De Negócio
- Quais regras do `project-plaintext-context` governam essa feature? `dark mode only`, `mobile-first` interfaces.
- Existe impacto em assinatura, trial, PPV, relacionamento ou visibilidade? Não diretamente.
- Existe impacto em blog/editorial? A paleta precisa alinhar à arquitetura de design do Blog Multi-Silo.

## 6. Impacto Em Dados / Schema
- N/A

## 7. Impacto Em RBAC
- N/A

## 8. Impacto Em UI
- É frontend público ou privado? Ambos.
- Regras de layout: Garantir tokens `zinc`, verde esmeralda (`emerald/lime` ou a cor exata definida pela marca) e supressão total do `yellow/amber` legado.
- Regras de mobile-first: Remover resquícios de classes que tentam forçar container desktop fora do editorial.
- Navegação esperada: Intacta.
- Estados vazios/erro/loading: Devem refletir botões dark modernizados.

## 9. Architecture Delta
- O que muda na arquitetura atual? Padroniza uso do tailwind variables/plugins. Nenhum módulo dependente backend quebra.
- Isso cria novo módulo, fluxo ou dependência? Não.
- Existe migração de legado? Sim (css puramente).

## 10. Acceptance Criteria
- [ ] `tailwind.config.ts` (ou similar) só possui definições do projeto válido e paleta nova.
- [ ] O repositório não tem classes como `bg-yellow-500`, `text-gold` (se usado antigamente).
- [ ] Aplicação renderiza estritamente em dark mode.
- [ ] Headers e fontes globais não forçam 'Inter' de forma intrusiva desrespeitando o design unificado.

## 11. Task Breakdown
- [ ] Ajustar `tailwind.config.ts` (tema e tokens)
- [ ] Limpar `app/globals.css`
- [ ] Buscar e renomear utilitários Tailwind aplicados em `src/components/ui/`
- [ ] Validar renderização via navegador

## 12. Skills Recomendados
- `project-plaintext-context`
- `frontend-design`
- `tailwind-css-patterns`
