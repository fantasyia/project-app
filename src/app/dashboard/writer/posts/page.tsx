import { redirect } from "next/navigation";

export const metadata = { title: "Artigos | Redator Fantasyia" };

export default function WriterPostsPage() {
  redirect("/dashboard/blog");
}
