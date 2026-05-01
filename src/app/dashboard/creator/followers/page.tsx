import { Users } from "lucide-react";
import { getFollowers } from "@/lib/actions/social";

export const metadata = { title: "Seguidores | Fantasyia" };

type FollowerItem = {
  id: string;
  display_name: string | null;
  handle: string | null;
  avatar_url: string | null;
};

export default async function FollowersPage() {
  const followers = (await getFollowers()) as FollowerItem[];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-5 sm:py-8 lg:gap-8 lg:px-6">
      <section className="rounded-[30px] border border-white/8 bg-[radial-gradient(circle_at_top,rgba(0,168,107,0.16),transparent_48%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0))] p-5 sm:p-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-brand-500">
          <Users size={12} />
          Comunidade do creator
        </div>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-thin tracking-[-0.05em] text-white sm:text-4xl">
              Seguidores que ja chegaram no seu ecossistema
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-light leading-7 text-brand-text-muted">
              Esta tela agora resume a base atual de relacionamento de forma mais proxima de um app
              do que de uma lista administrativa seca.
            </p>
          </div>

          <div className="rounded-[24px] border border-white/8 bg-black/30 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-text-muted">
              Total atual
            </p>
            <p className="mt-2 text-3xl font-thin tracking-[-0.05em] text-white">
              {followers.length}
            </p>
          </div>
        </div>
      </section>

      {followers.length === 0 ? (
        <section className="rounded-[28px] border border-dashed border-white/10 bg-white/[0.02] px-5 py-12 text-center sm:px-6">
          <p className="text-lg font-light text-white">Nenhum seguidor ainda.</p>
          <p className="mx-auto mt-3 max-w-md text-sm font-light leading-6 text-brand-text-muted">
            Continue publicando e refinando seus planos. Quando o perfil ganhar tracao, esta area
            passa a refletir sua base de relacionamento.
          </p>
        </section>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {followers.map((follower) => (
            <article
              key={follower.id}
              className="rounded-[26px] border border-white/8 bg-white/[0.03] p-5 transition-colors hover:border-brand-500/20"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-500/15 text-lg font-semibold text-brand-300">
                  {follower.display_name?.[0]?.toUpperCase() || "?"}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {follower.display_name || "Seguidor"}
                  </p>
                  <p className="mt-1 truncate text-[10px] uppercase tracking-[0.22em] text-brand-text-muted">
                    @{follower.handle || "fantasyia_user"}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-[20px] border border-white/6 bg-black/30 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-500">
                  Estado da relacao
                </p>
                <p className="mt-3 text-sm font-light leading-6 text-brand-text-muted">
                  Usuario ja conectado ao seu perfil e elegivel para evoluir para assinatura,
                  unlocks ou relacionamento direto no chat.
                </p>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
