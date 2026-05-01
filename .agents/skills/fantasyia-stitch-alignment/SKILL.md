---
name: fantasyia-stitch-alignment
description: |
  Alinha qualquer uso de Stitch no FantasyIA com o contexto real do projeto.
  Use este skill sempre que a tarefa envolver os skills dentro de
  `stitch-skills-main`, geração de telas via Stitch, DESIGN.md, conversão de
  telas Stitch para React/Next.js, ou experimentação visual que precise respeitar
  dark mode only, mobile-first, paleta da marca, separação público/privado e a
  arquitetura real do repositório.
---

# FantasyIA Stitch Alignment

Este skill existe para impedir que o Stitch ou seus presets genéricos gerem telas bonitas, mas incompatíveis com o FantasyIA.

## Antes De Usar Stitch
Ler sempre:
1. `../project-plaintext-context/SKILL.md`
2. `../frontend-design/SKILL.md`
3. `../../../docs/sdd/04-skill-map.md`

## Overrides Obrigatórios
Ao usar qualquer skill de `stitch-skills-main`, aplicar estes overrides:
- dark mode only;
- mobile-first em todo o ecossistema;
- única exceção desktop-first: backend editorial do Redator de Blog;
- paleta oficial verde/cinza do FantasyIA;
- nada de `Inter` como escolha automática da marca;
- nada de roxo/neon azul;
- nada de tema claro;
- nada de inventar métricas, KPIs, números ou conteúdo falso sem marcar como placeholder;
- o chat é canal comercial central, não detalhe decorativo.

## Público Vs Privado Em Stitch

### Público
Pode usar Stitch para:
- landing pages;
- home pública;
- páginas de descoberta abertas;
- blog público;
- páginas institucionais.

Regras:
- mobile-first;
- pode ser mais editorial e atmosférico;
- pode usar layout full-width responsivo;
- deve respeitar rodapé institucional e identidade do produto.

### Privado
Pode usar Stitch com muito mais cuidado para:
- subscriber app;
- creator studio;
- admin CRM;
- affiliate portal;
- backend editorial do blog.

Regras:
- subscriber app: pensar em tela mobile real, 390px como referência primária;
- creator/admin/affiliate: app dark, mais funcional, sem virar SaaS genérico;
- admin e affiliate podem ser mais densos, mas ainda mobile-first;
- backend editorial do blog é a única exceção desktop-first.

## Override Para Conversão Stitch -> Código
Se usar `stitch-skills-main/react-components`, sobrescrever as premissas genéricas:
- o projeto não é Vite; é Next.js 16 App Router;
- não assumir `App.tsx`;
- não impor `src/data/mockData.ts` se isso conflitar com a arquitetura do repositório;
- preservar a semântica do domínio FantasyIA ao nomear componentes e props;
- converter design para tokens do projeto, não manter hex arbitrário se já houver token oficial;
- respeitar roteamento, layouts e grupos de rota do App Router.

## O Que Conferir Antes De Aceitar Uma Tela
- a área está na categoria correta: público ou privada;
- a tela não sugere regra errada de assinatura, trial ou PPV;
- a estética não parece clara, dourada legada ou SaaS genérico;
- a navegação está correta para a área;
- a tela cabe no papel real daquele módulo no produto.

## Se O Stitch Divergir Do Projeto
Se a saída do Stitch conflitar com o FantasyIA:
- trate a saída como rascunho visual;
- adapte antes de integrar;
- priorize a regra do projeto, não o preset do Stitch.
