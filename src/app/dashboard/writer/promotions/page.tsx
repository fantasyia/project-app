import { redirect } from "next/navigation";

export const metadata = { title: "Promocoes | Redator Fantasyia" };

export default function PromotionsPage() {
  redirect("/dashboard/blog/seo");
}
