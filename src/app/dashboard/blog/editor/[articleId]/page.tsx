import { notFound } from "next/navigation";
import { AdvancedEditor } from "@/components/editor/AdvancedEditor";
import { getArticleByIdForEditor } from "@/lib/actions/blog";
import { getSilos } from "@/lib/actions/silo";

export const metadata = { title: "Editor de posts | Mini WordPress | FantasyIA" };

export default async function MiniWordPressEditorPage({ params }: { params: Promise<{ articleId: string }> }) {
  const { articleId } = await params;
  const [article, silos] = await Promise.all([
    getArticleByIdForEditor(articleId),
    getSilos().catch(() => []),
  ]);

  if (!article) return notFound();

  return <AdvancedEditor mode="edit" article={article} silos={silos} />;
}
