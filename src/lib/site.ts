export const SITE_NAME = "FantasyIA";
export const SITE_DOMAIN = "fantasyia.com";
export const SITE_URL = `https://${SITE_DOMAIN}`;
export const SITE_DESCRIPTION =
  "Conteudo editorial sobre arte com IA, creator economy, monetizacao visual e experiencias digitais premium.";
export const SITE_LOCALE = "pt-BR";
export const SITE_BRAND_TAGLINE =
  "Arte IA, creators e conteudo visual premium";
export const SITE_CONTACT_EMAIL = "contato@fantasyia.com";
export const AMAZON_AFFILIATE_DISCLOSURE =
  "Este conteudo pode conter referencias comerciais, ferramentas ou produtos parceiros. Quando houver links patrocinados ou afiliados, isso sera indicado no contexto editorial.";

function normalizeComparableText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function isStandardAffiliateDisclosure(value: string | null | undefined) {
  if (!value || !value.trim()) return false;
  const normalized = normalizeComparableText(value);
  const standard = normalizeComparableText(AMAZON_AFFILIATE_DISCLOSURE);
  if (!normalized || !standard) return false;
  if (normalized === standard) return true;
  const coreTerms = ["associado da amazon", "compras qualificadas", "links de afiliado"];
  return coreTerms.every((term) => normalized.includes(term));
}
