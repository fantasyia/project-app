export const fantasyiaBlogBrand = {
  name: "FantasyIA",
  shortName: "FantasyIA",
  domain: "fantasyia.com",
  url: "https://fantasyia.com",
  locale: "pt-BR",
  description:
    "Blog editorial sobre arte IA, fotografia, creator economy e conteudo visual privado premium.",
  tagline: "Arte, creators e conteudo visual premium",
  searchPlaceholder: "Buscar arte IA, creators, assinatura, PPV...",
  audience:
    "Creators, assinantes e operadores interessados em conteudo visual privado premium.",
  tone:
    "premium, direto, visual, estrategico, sem promessas absolutas e com foco em decisao pratica.",
  publicLinks: [
    { label: "Planos", href: "/pricing" },
    { label: "Termos", href: "/terms" },
    { label: "Privacidade", href: "/privacy" },
  ],
  fallbackSilos: [
    { name: "Arte IA e fotografia", slug: "arte-ia-fotografia" },
    { name: "Creator economy", slug: "creator-economy-premium" },
    { name: "Conteudo privado", slug: "conteudo-visual-privado" },
    { name: "Monetizacao", slug: "monetizacao-assinaturas" },
    { name: "Comunidade", slug: "comunidade-engajamento" },
    { name: "Compliance", slug: "seguranca-direitos-compliance" },
  ],
  editorialGroups: [
    "Guias praticos",
    "Tendencias visuais",
    "Estrategia de monetizacao",
    "Operacao de creators",
    "SEO e descoberta",
    "Compliance e protecao",
  ],
};

export type FantasyiaBlogBrand = typeof fantasyiaBlogBrand;
