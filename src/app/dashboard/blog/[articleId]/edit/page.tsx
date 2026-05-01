import { redirect } from "next/navigation";

export const metadata = { title: "Editar post | Mini WordPress | FantasyIA" };

export default async function EditArticlePage({ params }: { params: Promise<{ articleId: string }> }) {
  const { articleId } = await params;
  redirect(`/dashboard/blog/editor/${articleId}`);
}
