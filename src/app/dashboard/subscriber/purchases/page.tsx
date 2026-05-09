import Image from "next/image";
import { Crown, Gift, Image as ImageIcon, Repeat, Unlock, Video } from "lucide-react";
import { BackButton } from "@/components/navigation/BackButton";
import { getPurchaseHistory } from "@/lib/actions/engagement";
import { parsePostMediaAsset } from "@/lib/media/post-media";

export const metadata = { title: "Acessos liberados | Fantasyia" };

export default async function PurchasesPage() {
  const purchases = await getPurchaseHistory();
  const recurringCount = purchases.filter((purchase) => purchase.kind === "subscription").length;
  const unlockCount = purchases.filter((purchase) => purchase.kind === "ppv_post" || purchase.kind === "ppv_chat").length;

  return (
    <div className="min-h-screen bg-transparent px-4 pb-8 pt-4">
      <section className="overflow-hidden rounded-[28px] border border-white/8 bg-white/[0.03] shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <div className="border-b border-white/8 px-5 pb-5 pt-4">
          <div className="flex items-center gap-3">
            <BackButton
              fallbackHref="/dashboard/user/feed"
              label=""
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-brand-text-muted transition hover:text-white"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-[0.32em] text-brand-text-muted">Acessos liberados</p>
              <h1 className="mt-2 text-2xl font-light tracking-tight text-white">Conteudos e assinaturas</h1>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/8 bg-black/25 p-4">
              <p className="text-[10px] uppercase tracking-[0.28em] text-brand-text-muted">Unlocks</p>
              <p className="mt-2 text-2xl font-light text-white">{unlockCount}</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-black/25 p-4">
              <p className="text-[10px] uppercase tracking-[0.28em] text-brand-text-muted">Assinaturas</p>
              <p className="mt-2 text-2xl font-light text-white">{recurringCount}</p>
            </div>
          </div>
        </div>
      </section>

      {purchases.length === 0 ? (
        <div className="mt-4 rounded-[28px] border border-dashed border-white/10 bg-black/20 px-6 py-16 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
            <Unlock size={24} className="text-brand-text-muted" />
          </div>
          <h2 className="text-lg text-white">Nenhum acesso liberado ainda</h2>
          <p className="mt-2 text-sm leading-6 text-brand-text-muted">
            Assinaturas e desbloqueios aparecem aqui sem exibir dados de gastos.
          </p>
        </div>
      ) : (
        <section className="mt-4 space-y-3">
          {purchases.map((purchase) => (
            <article key={purchase.id} className="overflow-hidden rounded-[26px] border border-white/8 bg-white/[0.03] shadow-[0_18px_40px_rgba(0,0,0,0.28)]">
              <div className="flex gap-4 p-4">
                <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-surface-low">
                  {(() => {
                    const mediaAsset = parsePostMediaAsset(
                      purchase.post?.media_url || purchase.message?.media_url || null
                    );
                    const isVideo =
                      purchase.post?.post_type === "video" ||
                      purchase.message?.message_type === "ppv_locked" ||
                      mediaAsset.isVideo;

                    if (!mediaAsset.mediaUrl) {
                      if (purchase.kind === "subscription") return <Repeat size={22} className="text-brand-text-muted" />;
                      if (purchase.kind === "tip") return <Gift size={22} className="text-brand-text-muted" />;
                      if (isVideo) return <Video size={22} className="text-brand-text-muted" />;
                      return <ImageIcon size={22} className="text-brand-text-muted" />;
                    }

                    if (isVideo) {
                      if (mediaAsset.posterUrl) {
                        return (
                          <Image
                            src={mediaAsset.posterUrl}
                            alt={purchase.post?.content || purchase.message?.content || "Midia liberada"}
                            width={80}
                            height={80}
                            unoptimized
                            draggable={false}
                            className="h-full w-full object-cover"
                          />
                        );
                      }

                      return (
                        <video
                          src={mediaAsset.mediaUrl}
                          muted
                          playsInline
                          preload="metadata"
                          controlsList="nodownload noplaybackrate"
                          disablePictureInPicture
                          className="h-full w-full object-cover"
                        />
                      );
                    }

                    return (
                      <Image
                        src={mediaAsset.mediaUrl}
                        alt={purchase.post?.content || purchase.message?.content || "Midia liberada"}
                        width={80}
                        height={80}
                        unoptimized
                        draggable={false}
                        className="h-full w-full object-cover"
                      />
                    );
                  })()}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.24em] text-brand-text-muted">
                        {purchase.kind === "subscription"
                          ? "Assinatura"
                          : purchase.kind === "tip"
                            ? "Interacao"
                            : purchase.kind === "ppv_chat"
                              ? "Chat liberado"
                              : "Conteudo liberado"}
                      </p>
                      <h2 className="mt-2 line-clamp-2 text-sm leading-6 text-white">{purchase.description}</h2>
                    </div>
                    <div className="inline-flex items-center gap-1 rounded-full border border-brand-500/20 bg-brand-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-brand-300">
                      {purchase.kind === "subscription" && <Crown size={11} />}
                      {purchase.status}
                    </div>
                  </div>

                  <p className="mt-4 text-xs text-brand-text-muted">
                    {new Date(purchase.created_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
