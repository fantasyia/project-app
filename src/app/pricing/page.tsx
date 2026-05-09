import { redirect } from "next/navigation";

export const metadata = { title: "Explorar creators | Fantasyia" };

export default function PricingPage() {
  redirect("/dashboard/user/search");
}
