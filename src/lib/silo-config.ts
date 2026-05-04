export type SiloIntent = "Informacional" | "Investigacao";
export type SiloContentType = "Artigo Informativo";

export type SiloConfig = {
  slug: string;
  title: string;
  description: string;
  targetKeyword: string;
  intent: SiloIntent;
  contentType: SiloContentType;
  legacySlugs: string[];
};

export const SILOS: SiloConfig[] = [
  {
    slug: "arte-ia-e-fotografia",
    title: "Arte IA e fotografia",
    description: "Guias sobre criacao visual com IA, fotografia sintetica, prompts, estilos e composicao.",
    targetKeyword: "arte IA",
    intent: "Informacional",
    contentType: "Artigo Informativo",
    legacySlugs: [],
  },
  {
    slug: "creator-economy-premium",
    title: "Creator economy premium",
    description: "Estrategias para creators, assinaturas, relacionamento com audiencia e monetizacao recorrente.",
    targetKeyword: "creator economy",
    intent: "Investigacao",
    contentType: "Artigo Informativo",
    legacySlugs: [],
  },
  {
    slug: "conteudo-visual-privado",
    title: "Conteudo visual privado",
    description: "Conteudos sobre experiencia premium, acesso privado, PPV, seguranca e curadoria visual.",
    targetKeyword: "conteudo visual premium",
    intent: "Investigacao",
    contentType: "Artigo Informativo",
    legacySlugs: [],
  },
  {
    slug: "monetizacao-e-assinaturas",
    title: "Monetizacao e assinaturas",
    description: "Modelos de assinatura, venda avulsa, pricing, retencao e conversao para produtos digitais.",
    targetKeyword: "monetizacao de conteudo",
    intent: "Investigacao",
    contentType: "Artigo Informativo",
    legacySlugs: [],
  },
];

const SILO_REDIRECTS = new Map(
  SILOS.flatMap((silo) => silo.legacySlugs.map((legacySlug) => [legacySlug, silo.slug] as const))
);

export const EDITORIAL_GROUPS = [
  "Descoberta",
  "Criacao",
  "Monetizacao",
  "Retencao",
  "Seguranca",
  "Tendencias",
] as const;

export function getCanonicalSiloSlug(slug: string): string {
  return SILO_REDIRECTS.get(slug) ?? slug;
}

export function getLegacySiloRedirect(slug: string): string | null {
  return SILO_REDIRECTS.get(slug) ?? null;
}

export function getSiloQueryCandidates(slug: string): string[] {
  const canonicalSlug = getCanonicalSiloSlug(slug);
  const silo = SILOS.find((item) => item.slug === canonicalSlug);
  return Array.from(new Set([slug, canonicalSlug, ...(silo?.legacySlugs ?? [])].filter(Boolean)));
}

export function getSilo(slug: string): SiloConfig | undefined {
  const canonicalSlug = getCanonicalSiloSlug(slug);
  return SILOS.find((silo) => silo.slug === canonicalSlug);
}

export function getSiloOrThrow(slug: string): SiloConfig {
  const silo = getSilo(slug);
  if (!silo) throw new Error(`Configuracao de silo nao encontrada: ${slug}`);
  return silo;
}
