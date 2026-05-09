import { PublicBlogIndex } from "@/components/blog/public-blog-index";
import { fantasyiaBlogBrand } from "@/lib/miniwordpress/fantasyia-brand";

export const metadata = {
  title: "Blog | FantasyIA",
  description: fantasyiaBlogBrand.description,
};

export default async function PublicBlogPage() {
  return <PublicBlogIndex />;
}
