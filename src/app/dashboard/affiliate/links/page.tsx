import { LinksClient } from "./links-client";
import { getCreatorsForAffiliate } from "@/lib/actions/affiliate";

export const metadata = { title: "Gerar Links | Afiliado Fantasyia" };

export default async function LinksPage() {
  const creators = await getCreatorsForAffiliate();
  return <LinksClient creators={creators} />;
}
