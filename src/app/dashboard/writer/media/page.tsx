import { redirect } from "next/navigation";

export const metadata = { title: "Midia | Redator Fantasyia" };

export default function MediaPage() {
  redirect("/dashboard/blog/silos");
}
