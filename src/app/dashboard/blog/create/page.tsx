import { getSilos } from "@/lib/actions/silo";
import { AdvancedEditor } from "@/components/editor/AdvancedEditor";

export const metadata = { title: "Novo post | Mini WordPress | FantasyIA" };

export default async function CreateArticlePage() {
  const silos = await getSilos().catch(() => []);

  return <AdvancedEditor mode="create" silos={silos} />;
}
