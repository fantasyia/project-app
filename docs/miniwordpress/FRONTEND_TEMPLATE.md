# Mini WordPress Frontend Template

Status: draft especializado inicial  
Data: 2026-04-28

## 1. Objetivo

Definir as estruturas publicas que pertencem ao Mini WordPress, mas que devem se adaptar visualmente a qualquer marca.

O frontend publico nao e totalmente Core nem totalmente Brand. Ele e:

```txt
Frontend Template + Brand Adapter
```

## 2. Regra principal

Template define:

- Estrutura.
- Posicionamento.
- Responsividade.
- Comportamento.
- Hierarquia de informacao.

Brand Adapter define:

- Logo.
- Cores.
- Fontes.
- Imagens.
- Tom.
- Copy institucional.
- Hover/acabamento visual.

## 3. Menu de 2 linhas

O menu de 2 linhas e uma assinatura estrutural do Mini WordPress.

### Estrutura desktop

```txt
Logo / busca

[Inicio]
[Inicio]  [Silo 1] [Silo 2] [Silo 3] [Silo 4]  [Sobre]
          [Silo 5] [Silo 6] [Silo 7] [Silo 8]  [Contato]
```

Regras:

- `Inicio` ocupa duas linhas no lado esquerdo.
- Silos ocupam o centro em duas linhas.
- Links institucionais comuns ficam no fim/direita.
- Quantidade de silos pode variar.
- Layout deve aceitar 4 + 4 como padrao, mas nao quebrar com menos/mais.
- No mobile, o acesso aos silos pode virar menu recolhido, mas nao deve sumir.

Arquivo atual:

- `components/site/HomeExpandedNav.tsx`

Problema atual:

- Lista `SILO_NAV_ITEMS` esta hardcoded para CareGlow.

Destino:

- Receber silos ativos de Supabase ou Brand Adapter.
- Preservar classes estruturais `system-silo-nav-*`.
- Deixar cores/hover para variaveis de marca.

## 4. Classes estruturais existentes

Em `app/globals.css`:

- `.system-silo-nav-wrapper`
- `.system-silo-nav-grid`
- `.system-silo-nav-start`
- `.system-silo-nav-center`
- `.system-silo-nav-item`
- `.system-silo-nav-end-top`
- `.system-silo-nav-end-bottom`

Contrato:

- Essas classes sao Template.
- Elas nao devem carregar paleta especifica de CareGlow.
- Cores devem vir de `--brand-*`.

## 5. Header publico

Arquivo atual:

- `components/site/SiteHeader.tsx`

Responsabilidades:

- Mobile header.
- Desktop header.
- Busca.
- Menu expandido na home.
- Menu padrao em paginas internas.
- Estado compacto no scroll.

Problemas atuais:

- `HEADER_LOGO_SRC = "/logomarca-bebe-na-rota.webp"` esta hardcoded.
- Placeholder de busca cita skincare.
- Links fallback sao genericos, mas a navegacao real ainda depende de props/brand.

Destino:

- Logo vem do Brand Adapter.
- Placeholder vem do Brand Adapter.
- Links institucionais vem do Brand Adapter.
- Silos vem do banco/config.

## 6. Footer publico

Arquivo atual:

- `components/site/SiteFooter.tsx`

Template deve preservar:

- Colunas de marca.
- Temas/silos.
- Institucional.
- Contato.
- Aviso de afiliados.
- Copyright.

Brand Adapter define:

- Texto de marca.
- Logo.
- Links institucionais.
- Email.
- Disclaimer.

## 7. Home

Arquivos atuais:

- `app/page.tsx`
- `components/site/HomeClient.tsx`
- `components/site/HomeSearchResults.tsx`
- `components/site/HomeSliderCards.tsx`
- `components/site/SiloNarrativeCarousel.tsx`

Template deve preservar:

- Busca editorial.
- Navegacao por silos.
- Destaques de posts/silos.
- Estrutura de descoberta.

Brand Adapter define:

- Hero/copy.
- Imagens.
- Tom visual.
- Ordem editorial se especifica.

## 8. Pagina de silo

Arquivo atual:

- `app/[silo]/page.tsx`

Template deve preservar:

- Header/intro do silo.
- Conteudo pilar quando existir.
- Lista de posts.
- Grupos editoriais.
- SEO canonical.
- Links internos.

Brand Adapter define:

- Visual publico.
- Copy do silo.
- Imagens.

## 9. Pagina de post

Arquivo atual:

- `app/[silo]/[slug]/page.tsx`

Template deve preservar:

- Breadcrumb.
- H1.
- Autor/data.
- Hero image.
- Conteudo renderizado.
- TOC.
- FAQ/schema quando existir.
- Afiliados/disclaimer.
- Links internos.

Brand Adapter define:

- Tipografia publica.
- Cores publicas.
- Estilo de imagens/cards.
- Tom de metadados.

## 10. Indice / TOC

Arquivo atual:

- `components/site/PostToc.tsx`

Regras:

- Deve ser estrutura de Template.
- Deve funcionar em desktop/mobile.
- Deve usar headings reais do artigo.
- Estilo visual vem da marca.

## 11. CSS publico

Problema atual:

`app/globals.css` mistura:

- Tema CareGlow.
- Admin Mini WordPress.
- Editor.
- Template do menu.
- Componentes publicos.

Destino:

- Documentar dominios primeiro.
- Depois separar fisicamente ou por secoes claras:
  - `admin system`
  - `brand public theme`
  - `frontend template structure`
  - `editor public preview`

## 12. Dados para alimentar o template

Fonte preferida:

- `silos` ativos no Supabase.
- Config Brand Adapter para links institucionais.
- `lib/site.ts` futuro como adapter, nao hardcode.

Campos relevantes:

- `silos.name`
- `silos.slug`
- `silos.menu_order`
- `silos.show_in_navigation`
- `silos.is_active`

## 13. Pendencias

- [ ] Remover hardcode de silos de `HomeExpandedNav.tsx`.
- [ ] Remover hardcode de logo Bebe na Rota de `SiteHeader.tsx`.
- [ ] Criar contrato `BrandConfig`.
- [ ] Criar helper para nav publica.
- [ ] Definir comportamento quando houver mais de 8 silos.
- [ ] Validar mobile do menu de silos.
- [ ] Separar CSS estrutural de CSS de marca.
