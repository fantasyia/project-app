import {
  getPublicArticleMetadata,
  PublicArticlePage,
} from "@/components/blog/public-article-page";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return getPublicArticleMetadata(slug);
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PublicArticlePage slug={slug} />;
}
