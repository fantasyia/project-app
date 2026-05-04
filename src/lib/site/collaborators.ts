import { SITE_NAME } from "@/lib/site";

export type CollaboratorLink = {
  label: string;
  href: string;
};

export type CollaboratorProfile = {
  id: string;
  name: string;
  professionalName?: string;
  siteRole: string;
  shortBio: string;
  fullBio: string[];
  specialties: string[];
  location: string;
  experienceSince: number;
  image: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
  links: CollaboratorLink[];
  reviewedByShort: string;
  expertBoxShort: string;
  aliases?: string[];
};

export const FANTASYIA_EDITORIAL_PROFILE: CollaboratorProfile = {
  id: "equipe-fantasyia",
  name: "Equipe FantasyIA",
  professionalName: "Equipe FantasyIA",
  siteRole: `Equipe editorial do ${SITE_NAME}`,
  shortBio:
    "Equipe editorial focada em arte com IA, creator economy, monetizacao visual, seguranca digital e conteudo premium.",
  fullBio: [
    `A equipe editorial do ${SITE_NAME} organiza guias, comparativos e analises para creators, assinantes e projetos visuais digitais.`,
    "A metodologia combina leitura de mercado, contexto de produto, estrategia de SEO e criterios de clareza para separar promessa real de exagero tecnico.",
  ],
  specialties: [
    "Arte com IA",
    "Creator economy",
    "Monetizacao visual",
    "Conteudo premium",
    "SEO editorial",
    "Seguranca e compliance digital",
  ],
  location: "Brasil",
  experienceSince: 2026,
  image: {
    src: "/placeholder-avatar.svg",
    alt: `Equipe editorial do ${SITE_NAME}`,
    width: 720,
    height: 960,
  },
  links: [],
  reviewedByShort: "Conteudo revisado pela equipe editorial FantasyIA.",
  expertBoxShort:
    `Equipe editorial do ${SITE_NAME}, com foco em arte IA, creators e conteudo visual premium.`,
  aliases: ["FantasyIA", "Equipe editorial FantasyIA", "Equipe FantasyIA"],
};

export const ANA_LINDA_PROFILE = FANTASYIA_EDITORIAL_PROFILE;
export const BEBE_NA_ROTA_PROFILE = FANTASYIA_EDITORIAL_PROFILE;
export const COLLABORATORS: CollaboratorProfile[] = [FANTASYIA_EDITORIAL_PROFILE];

function normalizeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function findCollaboratorByName(name: string | null | undefined) {
  if (!name || !name.trim()) return null;
  const target = normalizeName(name);
  for (const collaborator of COLLABORATORS) {
    const candidates = [collaborator.name, collaborator.professionalName, ...(collaborator.aliases ?? [])]
      .filter(Boolean)
      .map((item) => normalizeName(item as string));
    if (candidates.includes(target)) return collaborator;
  }
  return null;
}

export const EDITOR_AUTHOR_OPTIONS = [FANTASYIA_EDITORIAL_PROFILE.name, "Equipe de SEO FantasyIA", "Equipe de Produto FantasyIA"];
