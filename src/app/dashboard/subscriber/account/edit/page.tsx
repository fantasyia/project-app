import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/actions/auth";
import { SubscriberProfileEditForm } from "./profile-edit-form";

export const metadata = { title: "Editar Conta | Fantasyia" };

export default async function SubscriberAccountEditPage() {
  const user = await getCurrentUser("subscriber");

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link
          href="/dashboard/user/account"
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-brand-text-muted transition hover:text-brand-300"
        >
          <ArrowLeft size={14} />
          Voltar para conta
        </Link>
        <h1 className="text-xl font-semibold text-white">Editar perfil do usuario</h1>
        <p className="text-sm text-brand-text-muted">
          Ajuste nome, bio e avatar da area de usuario sem alterar permissoes de creator.
        </p>
      </div>

      <SubscriberProfileEditForm
        user={{
          display_name: user?.display_name || null,
          handle: user?.handle || null,
          bio: user?.bio || null,
          avatar_url: user?.avatar_url || null,
          email: user?.email || null,
        }}
      />
    </div>
  );
}
