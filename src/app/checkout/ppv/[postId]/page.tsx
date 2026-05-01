import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Eye, Lock, Sparkles } from "lucide-react";
import { getPpvCheckoutDetails } from "@/lib/actions/checkout";
import { parsePostMediaAsset } from "@/lib/media/post-media";
import { PpvCheckoutForm } from "./ppv-checkout-form";

export const metadata = {
  title: "Unlock PPV | Fantasyia",
  description: "Desbloqueie um post PPV na Fantasyia.",
};

function formatCurrency(price: string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.parseFloat(price || "0"));
}

function getMediaLabel(postType: string) {
  if (postType === "video") return "Video exclusivo";
  if (postType === "image") return "Imagem premium";
  return "Post premium";
}

function getPreviewText(content: string | null) {
  if (!content) return "Midia exclusiva liberada apenas apos a confirmacao do unlock.";
  return content.length > 140 ? `${content.slice(0, 137)}...` : content;
}

export default async function PpvCheckoutPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  const checkout = await getPpvCheckoutDetails(postId);

  if (!checkout) {
    return (
      <div className="min-h-screen bg-black px-6 py-16 text-white">
        <div className="mx-auto max-w-md rounded-[32px] border border-white/10 bg-white/[0.03] p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
          <p className="text-[11px] uppercase tracking-[0.35em] text-brand-text-muted">PPV</p>
          <h1 className="mt-4 text-3xl font-light tracking-tight">Unlock indisponivel</h1>
          <p className="mt-3 text-sm leading-6 text-brand-text-muted">
            Este conteudo nao esta mais disponivel para compra individual ou o link ficou invalido.
          </p>
          <Link
            href="/dashboard/user/feed"
            className="mt-8 inline-flex items-center gap-2 rounded-full border border-brand-500/30 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-brand-400 transition hover:border-brand-500 hover:text-brand-300"
          >
            <ArrowLeft size={14} />
            Voltar para o app
          </Link>
        </div>
      </div>
    );
  }

  const { creator, post, viewer } = checkout;
  const mediaAsset = parsePostMediaAsset(post.mediaUrl);
  const isVideoPost = post.postType === "video" || mediaAsset.isVideo;
  const priceLabel = formatCurrency(post.price);
  const previewText = getPreviewText(post.content);
  const mediaLabel = getMediaLabel(post.postType);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(0,168,107,0.2),_transparent_32%),linear-gradient(180deg,_#090c0a_0%,_#040404_52%,_#020202_100%)] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-4">
        <header className="sticky top-0 z-40 mb-4 rounded-full border border-white/10 bg-black/55 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <Link
              href={`/${creator.handle}`}
              className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-brand-text-muted transition hover:text-brand-300"
            >
              <ArrowLeft size={14} />
              Perfil
            </Link>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-300">
              <Lock size={12} />
              Unlock PPV
            </div>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-5">
          <section className="overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.04] shadow-[0_24px_90px_rgba(0,0,0,0.42)]">
            <div className="relative border-b border-white/8 px-5 pb-6 pt-6">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.12),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(0,168,107,0.2),_transparent_34%)]" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-text-muted">
                  <Sparkles size={12} className="text-brand-400" />
                  Compra avulsa
                </div>

                <div className="mt-5 flex items-start gap-4">
                  <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-white/10 bg-brand-surface-high">
                    {creator.avatar_url ? (
                      <Image src={creator.avatar_url} alt={creator.display_name} fill unoptimized className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-brand-500/20 text-xl font-semibold text-brand-300">
                        {creator.display_name?.[0]?.toUpperCase() || "F"}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] uppercase tracking-[0.3em] text-brand-text-muted">{mediaLabel}</p>
                    <h1 className="mt-2 text-3xl font-light tracking-tight">{priceLabel}</h1>
                    <p className="mt-2 text-sm text-brand-text-muted">
                      {creator.display_name} <span className="text-white/30">/</span> @{creator.handle}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-brand-text-muted">Pagamento</p>
                    <p className="mt-3 text-2xl font-light tracking-tight text-brand-300">{priceLabel}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-brand-text-muted">Acesso</p>
                    <p className="mt-3 text-xl font-light tracking-tight">Unitario</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-brand-text-muted">Liberacao</p>
                    <p className="mt-3 text-xl font-light tracking-tight">Instantanea</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6 px-5 py-6">
              <div className="overflow-hidden rounded-[28px] border border-white/10 bg-black/35">
                <div className="relative aspect-[4/5] overflow-hidden">
                  {mediaAsset.mediaUrl ? (
                    <>
                      {isVideoPost ? (
                        mediaAsset.posterUrl ? (
                          <Image
                            src={mediaAsset.posterUrl}
                            alt="Preview do conteudo PPV"
                            fill
                            unoptimized
                            className="object-cover blur-xl scale-110 opacity-80"
                          />
                        ) : (
                          <video
                            src={mediaAsset.mediaUrl}
                            muted
                            playsInline
                            preload="metadata"
                            className="h-full w-full object-cover blur-xl scale-110 opacity-80"
                          />
                        )
                      ) : (
                        <Image
                          src={mediaAsset.mediaUrl}
                          alt="Preview do conteudo PPV"
                          fill
                          unoptimized
                          className="object-cover blur-xl scale-110 opacity-80"
                        />
                      )}
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08),rgba(0,0,0,0.72))]" />
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,168,107,0.22),_transparent_34%),linear-gradient(180deg,_rgba(255,255,255,0.04)_0%,_rgba(255,255,255,0.01)_100%)]" />
                  )}

                  <div className="absolute inset-0 flex items-end p-5">
                    <div className="w-full rounded-3xl border border-white/10 bg-black/55 p-5 backdrop-blur-xl">
                      <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-brand-300">
                        <Eye size={12} />
                        Preview protegido
                      </div>
                      <p className="mt-4 text-sm leading-6 text-brand-text-base">{previewText}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="rounded-2xl border border-brand-500/20 bg-brand-500/10 p-4">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-brand-300">Regra de acesso</p>
                  <p className="mt-2 text-sm leading-6 text-brand-text-base">
                    O unlock PPV registra a compra avulsa e libera este post no perfil publico e no historico do assinante.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-brand-text-muted">Assinatura</p>
                  <p className="mt-2 text-sm leading-6 text-brand-text-base">
                    {viewer.hasActiveSubscription
                      ? "Mesmo com assinatura ou trial ativo, este conteudo continua sendo unitario. A compra PPV permanece obrigatoria."
                      : "Assinatura e PPV continuam separados. Este conteudo exige compra individual para abrir."}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[#070909]/90 shadow-[0_24px_90px_rgba(0,0,0,0.42)]">
            <div className="border-b border-white/8 px-5 pb-5 pt-6">
              <p className="text-[10px] uppercase tracking-[0.32em] text-brand-text-muted">Confirmacao PPV</p>
              <h2 className="mt-3 text-2xl font-light tracking-tight">Desbloqueie este PPV</h2>
              <p className="mt-2 text-sm leading-6 text-brand-text-muted">
                Revise o valor e confirme para liberar somente este conteudo avulso.
              </p>
            </div>

            <div className="px-5 py-6">
              <PpvCheckoutForm
                creatorHandle={creator.handle}
                creatorName={creator.display_name}
                hasActiveSubscription={viewer.hasActiveSubscription}
                hasUnlocked={viewer.hasUnlocked}
                isAuthenticated={viewer.isAuthenticated}
                isOwner={viewer.isOwner}
                postId={post.id}
                priceLabel={priceLabel}
              />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
