import { notFound } from "next/navigation";
import { SiloDetailPanel } from "@/components/silos/SiloDetailPanel";
import { getEditorArticles } from "@/lib/actions/blog";
import { getSiloBySlug } from "@/lib/actions/silo";

export const metadata = { title: "Painel de silo | Mini WordPress | FantasyIA" };

export default async function SiloDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [silo, articles] = await Promise.all([getSiloBySlug(slug), getEditorArticles()]);

  if (!silo) return notFound();

  const siloArticles = articles.filter((article) => article.silo_id === silo.id);

  return <SiloDetailPanel silo={silo} articles={siloArticles} />;
}
