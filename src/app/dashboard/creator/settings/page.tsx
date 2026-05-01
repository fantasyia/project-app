import { getCurrentUser } from "@/lib/actions/auth";
import { ProfileEditForm } from "./profile-edit-form";

export const metadata = { title: "Configurações | Fantasyia" };

export default async function CreatorSettingsPage() {
  const user = await getCurrentUser("creator");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-white">Configurações</h1>
        <p className="mt-1 text-sm text-brand-text-muted">
          Gerencie seu perfil público, nome e informações da conta.
        </p>
      </div>

      {/* Profile Edit Form */}
      <ProfileEditForm
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
