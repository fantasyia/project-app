import { getCurrentUser } from "@/lib/actions/auth";
import { BackButton } from "@/components/navigation/BackButton";
import { SubscriberProfileEditForm } from "./profile-edit-form";

export const metadata = { title: "Editar Conta | Fantasyia" };

export default async function SubscriberAccountEditPage() {
  const user = await getCurrentUser("subscriber");

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <BackButton fallbackHref="/dashboard/user/account" label="Voltar para conta" />
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
