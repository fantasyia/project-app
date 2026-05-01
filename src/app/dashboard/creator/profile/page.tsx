import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Settings, Edit3 } from "lucide-react";
import { getCurrentUser } from "@/lib/actions/auth";
import { sanitizePersistedAvatarUrl } from "@/lib/media/post-media";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Meu Perfil | Fantasyia" };

export default async function CreatorProfilePage() {
  const user = await getCurrentUser("creator");
  const supabase = await createClient();
  let creatorUser = user;

  if (creatorUser?.id) {
    const { data: creatorIdentity, error } = await supabase
      .from("creator_profiles")
      .select("public_display_name, public_handle, public_bio, public_avatar_url")
      .eq("user_id", creatorUser.id)
      .maybeSingle();

    if (!error && creatorIdentity) {
      creatorUser = {
        ...creatorUser,
        display_name: creatorIdentity.public_display_name || creatorUser.display_name,
        handle: creatorIdentity.public_handle || creatorUser.handle,
        bio: creatorIdentity.public_bio ?? creatorUser.bio,
        avatar_url: sanitizePersistedAvatarUrl(creatorIdentity.public_avatar_url ?? creatorUser.avatar_url),
      };
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center pt-2">
        <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-white/10 bg-brand-surface-high">
          {creatorUser?.avatar_url ? (
            <Image
              src={creatorUser.avatar_url}
              alt={creatorUser.display_name || "Avatar"}
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-500/30 to-brand-700/20 text-3xl font-bold text-brand-300">
              {creatorUser?.display_name?.[0]?.toUpperCase() || "?"}
            </div>
          )}
        </div>

        <h1 className="mt-3 text-xl font-bold text-white">{creatorUser?.display_name || "Creator"}</h1>
        <p className="text-sm text-brand-text-muted">@{creatorUser?.handle || "creator"}</p>

        {creatorUser?.bio && (
          <p className="mt-2 max-w-xs text-center text-sm leading-relaxed text-brand-text-muted">
            {creatorUser.bio}
          </p>
        )}

        <div className="mt-4 flex gap-2.5">
          <Link
            href="/dashboard/creator/settings"
            className="brand-gradient-btn flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-black"
          >
            <Edit3 size={14} />
            Editar perfil
          </Link>
          <Link
            href={`/${creatorUser?.handle || ""}`}
            className="flex items-center gap-2 rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.03]"
          >
            <ExternalLink size={14} />
            Ver publico
          </Link>
        </div>
      </div>

      <div className="h-px bg-white/[0.06]" />

      <div className="space-y-1">
        <InfoRow label="Nome" value={creatorUser?.display_name || "Nao definido"} />
        <InfoRow label="Handle" value={creatorUser?.handle ? `@${creatorUser.handle}` : "Nao definido"} />
        <InfoRow label="Email" value={creatorUser?.email || "Sem email"} />
        <InfoRow label="Tipo" value={creatorUser?.role || "creator"} highlight />
      </div>

      <div className="h-px bg-white/[0.06]" />

      <div className="space-y-1">
        <QuickLink href="/dashboard/creator/settings" icon={<Settings size={16} />} label="Configuracoes" />
        <QuickLink href="/dashboard/creator/studio" icon={<Edit3 size={16} />} label="Studio" />
        <QuickLink href={`/${creatorUser?.handle || ""}`} icon={<ExternalLink size={16} />} label="Pagina publica" />
      </div>
    </div>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between px-1 py-3">
      <span className="text-sm text-brand-text-muted">{label}</span>
      <span className={`text-sm ${highlight ? "brand-gradient-text font-semibold" : "text-white"}`}>
        {value}
      </span>
    </div>
  );
}

function QuickLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl px-1 py-3 text-sm text-brand-text-muted transition hover:text-white"
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
