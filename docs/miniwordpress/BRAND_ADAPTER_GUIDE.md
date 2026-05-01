# Mini WordPress Brand Adapter Guide

Status: draft especializado inicial  
Data: 2026-04-28

## 1. Objetivo

Brand Adapter e a camada que permite aplicar o Mini WordPress em qualquer marca/nicho sem contaminar o Core.

Exemplos de marcas destino:

- CareGlow
- Lindisse
- Bebe na Rota
- Adalba Pro
- FantasyIA blog
- Novos projetos de nicho

## 2. O que pertence ao Brand Adapter

- Nome da marca.
- Dominio.
- URL canonica.
- Logo.
- Cores publicas.
- Fontes publicas.
- Descricao.
- Tagline.
- Email.
- Disclaimer de afiliados.
- Links institucionais.
- Tom editorial.
- Nicho.
- Prompts por nicho.
- Silos iniciais.
- Grupos editoriais iniciais.
- Seeds de posts.
- Imagens publicas.
- Autores e revisores.

## 3. O que nao pertence ao Brand Adapter

- Admin dark mode.
- Layout estrutural do admin.
- Tiptap Core.
- APIs admin.
- Schema base Supabase.
- Link Hygiene.
- Guardian SEO.
- SERP tooling.
- Contentor adapter.
- Estrutura do menu de 2 linhas.
- Estrutura do TOC.

## 4. Configuracao desejada

Modelo futuro recomendado:

```ts
export type BrandConfig = {
  name: string;
  domain: string;
  url: string;
  locale: string;
  description: string;
  tagline: string;
  contactEmail: string;
  logo: {
    src: string;
    alt: string;
  };
  publicTheme: {
    colors: Record<string, string>;
    fonts: {
      body: string;
      display?: string;
    };
  };
  search: {
    placeholder: string;
  };
  affiliateDisclosure: string;
  editorial: {
    defaultAuthor: string;
    toneGuide: string;
    sourcePolicy: string;
  };
};
```

## 5. Estado atual no repo

Arquivo atual:

```txt
lib/site.ts
```

Hoje contem CareGlow hardcoded:

- `SITE_NAME = "CareGlow"`
- `SITE_DOMAIN = "careglow.com.br"`
- `SITE_DESCRIPTION`
- `SITE_BRAND_TAGLINE`
- `SITE_CONTACT_EMAIL`
- `AMAZON_AFFILIATE_DISCLOSURE`

Problema:

- Isso e Brand Adapter, nao Core.
- O pacote neutro nao deve exportar `CareGlow` como default invisivel.

## 6. Header admin

O admin pode mostrar logo/nome da marca, mas sem virar layout de marca.

Estado atual:

- `app/admin/components/AdminHeader.tsx` usa:
  - `NEXT_PUBLIC_BRAND_NAME`
  - `NEXT_PUBLIC_BRAND_INITIALS`
  - `NEXT_PUBLIC_BRAND_LOGO`

Regra:

- Header admin pertence ao Core.
- Dados exibidos pertencem ao Brand Adapter.

## 7. Header publico

Estado atual:

- `components/site/SiteHeader.tsx` usa logo hardcoded:
  - `/logomarca-bebe-na-rota.webp`

Destino:

- Usar `BrandConfig.logo.src`.
- Placeholder de busca deve vir de `BrandConfig.search.placeholder`.
- Links institucionais devem vir de config.

## 8. Silos iniciais

Silos sao dados de marca/nicho.

Core define:

- Como silos funcionam.
- Como sao listados.
- Como se relacionam com posts.
- Como entram no menu.

Brand Adapter define:

- Quais silos existem.
- Ordem.
- Nome.
- Descricao.
- Slug.
- Conteudo pilar.
- Grupos editoriais.

## 9. Prompts por nicho

Cada marca/nicho deve ter um prompt pack.

Categorias:

- Tom da marca.
- Regras de seguranca/confiabilidade.
- Fontes permitidas.
- Fontes proibidas.
- Entidades esperadas.
- Linguagem comercial permitida.
- Estilo de introducao.
- Estilo de fechamento.
- Regras de SEO local quando aplicavel.

Formato recomendado:

```txt
brand-prompts/
  tone.md
  seo.md
  entities.md
  internal-linking.md
  improve-fragment.md
  lsi.md
  source-policy.md
```

## 10. Seeds

Problema atual:

- `scripts/seed.ts` e `supabase/seed.json` sao CareGlow-specific.

Destino:

```txt
supabase/seeds/
  core.json
  brands/
    careglow.json
    lindisse.json
    bebe-na-rota.json
    adalba-pro.json
    fantasyia.json
```

Scripts futuros:

```bash
pnpm seed:core
pnpm seed:brand -- careglow
```

## 11. Checklist para nova marca

- [ ] Definir `BrandConfig`.
- [ ] Definir logo publica.
- [ ] Definir paleta.
- [ ] Definir fontes.
- [ ] Definir disclaimer.
- [ ] Definir links institucionais.
- [ ] Definir tom editorial.
- [ ] Definir prompt pack.
- [ ] Definir silos.
- [ ] Definir grupos editoriais.
- [ ] Definir seed inicial.
- [ ] Testar header/footer.
- [ ] Testar menu de 2 linhas.
- [ ] Testar post publico.
- [ ] Testar admin.

## 12. Pendencias

- [ ] Criar arquivo real `brand.config.ts` ou equivalente.
- [ ] Migrar `lib/site.ts` para usar config.
- [ ] Remover hardcodes de logos.
- [ ] Separar seeds de marca.
- [ ] Criar exemplos para CareGlow, Bebe na Rota e FantasyIA.
